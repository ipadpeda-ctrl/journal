import {
  users,
  trades,
  tradingDiary,
  goals,
  type User,
  type UpsertUser,
  type Trade,
  type InsertTrade,
  type TradingDiary,
  type InsertDiary,
  type Goal,
  type InsertGoal,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  updateUserCapital(id: string, initialCapital: number): Promise<User | undefined>;
  isFirstUser(): Promise<boolean>;

  // Trade operations
  getTradesByUser(userId: string): Promise<Trade[]>;
  getAllTrades(): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  updateTrade(id: number, userId: string, trade: Partial<InsertTrade>): Promise<Trade | undefined>;
  deleteTrade(id: number, userId: string): Promise<boolean>;
  getTradeById(id: number): Promise<Trade | undefined>;

  // Diary operations
  getDiaryByUser(userId: string): Promise<TradingDiary[]>;
  getDiaryByDate(userId: string, date: string): Promise<TradingDiary | undefined>;
  upsertDiary(diary: InsertDiary): Promise<TradingDiary>;
  deleteDiary(id: number, userId: string): Promise<boolean>;

  // Goal operations
  getGoalsByUser(userId: string): Promise<Goal[]>;
  getGoalByMonth(userId: string, month: number, year: number): Promise<Goal | undefined>;
  upsertGoal(goal: InsertGoal): Promise<Goal>;
  deleteGoal(id: number, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if this is the first user (becomes super_admin)
    const isFirst = await this.isFirstUser();
    const role = isFirst ? "super_admin" : (userData.role || "user");

    const [user] = await db
      .insert(users)
      .values({ ...userData, role })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserCapital(id: string, initialCapital: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ initialCapital, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async isFirstUser(): Promise<boolean> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return result[0].count === 0;
  }

  // Trade operations
  async getTradesByUser(userId: string): Promise<Trade[]> {
    return await db
      .select()
      .from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.date), desc(trades.time));
  }

  async getAllTrades(): Promise<Trade[]> {
    return await db
      .select()
      .from(trades)
      .orderBy(desc(trades.date), desc(trades.time));
  }

  async createTrade(trade: InsertTrade): Promise<Trade> {
    const [newTrade] = await db.insert(trades).values(trade).returning();
    return newTrade;
  }

  async updateTrade(id: number, userId: string, trade: Partial<InsertTrade>): Promise<Trade | undefined> {
    const [updated] = await db
      .update(trades)
      .set(trade)
      .where(and(eq(trades.id, id), eq(trades.userId, userId)))
      .returning();
    return updated;
  }

  async deleteTrade(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(trades)
      .where(and(eq(trades.id, id), eq(trades.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getTradeById(id: number): Promise<Trade | undefined> {
    const [trade] = await db.select().from(trades).where(eq(trades.id, id));
    return trade;
  }

  // Diary operations
  async getDiaryByUser(userId: string): Promise<TradingDiary[]> {
    return await db
      .select()
      .from(tradingDiary)
      .where(eq(tradingDiary.userId, userId))
      .orderBy(desc(tradingDiary.date));
  }

  async getDiaryByDate(userId: string, date: string): Promise<TradingDiary | undefined> {
    const [diary] = await db
      .select()
      .from(tradingDiary)
      .where(and(eq(tradingDiary.userId, userId), eq(tradingDiary.date, date)));
    return diary;
  }

  async upsertDiary(diary: InsertDiary): Promise<TradingDiary> {
    const existing = await this.getDiaryByDate(diary.userId, diary.date);
    if (existing) {
      const [updated] = await db
        .update(tradingDiary)
        .set({ content: diary.content, mood: diary.mood })
        .where(eq(tradingDiary.id, existing.id))
        .returning();
      return updated;
    }
    const [newDiary] = await db.insert(tradingDiary).values(diary).returning();
    return newDiary;
  }

  async deleteDiary(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(tradingDiary)
      .where(and(eq(tradingDiary.id, id), eq(tradingDiary.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Goal operations
  async getGoalsByUser(userId: string): Promise<Goal[]> {
    return await db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId))
      .orderBy(desc(goals.year), desc(goals.month));
  }

  async getGoalByMonth(userId: string, month: number, year: number): Promise<Goal | undefined> {
    const [goal] = await db
      .select()
      .from(goals)
      .where(and(eq(goals.userId, userId), eq(goals.month, month), eq(goals.year, year)));
    return goal;
  }

  async upsertGoal(goal: InsertGoal): Promise<Goal> {
    const existing = await this.getGoalByMonth(goal.userId, goal.month, goal.year);
    if (existing) {
      const [updated] = await db
        .update(goals)
        .set({
          targetTrades: goal.targetTrades,
          targetWinRate: goal.targetWinRate,
          targetProfit: goal.targetProfit,
        })
        .where(eq(goals.id, existing.id))
        .returning();
      return updated;
    }
    const [newGoal] = await db.insert(goals).values(goal).returning();
    return newGoal;
  }

  async deleteGoal(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
