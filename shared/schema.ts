import { pgTable, text, serial, integer, boolean, decimal, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => []
);

// User storage table with roles and authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("user"),
  isApproved: varchar("is_approved").notNull().default("pending"),
  // FIX: Usiamo decimal per precisione finanziaria
  initialCapital: decimal("initial_capital", { precision: 12, scale: 2 }).default("10000.00"),
  // FIX: Colonna per salvare le preferenze (coppie, emozioni, ecc.)
  preferences: jsonb("preferences").$type<{ pairs: string[]; emotions: string[] }>().default({ pairs: [], emotions: [] }),
  resetToken: varchar("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const registerUserSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri"),
  firstName: z.string().min(1, "Nome richiesto"),
  lastName: z.string().min(1, "Cognome richiesto"),
});

export type RegisterUser = z.infer<typeof registerUserSchema>;

export const loginUserSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(1, "Password richiesta"),
});

export type LoginUser = z.infer<typeof loginUserSchema>;

// Trades table connected to users
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: varchar("date").notNull(), // Entry Date
  time: varchar("time"), // Entry Time
  // FIX: Holding Time fields
  exitDate: varchar("exit_date"), 
  exitTime: varchar("exit_time"),
  pair: varchar("pair").notNull(),
  direction: varchar("direction").notNull(),
  // FIX: Numeri precisi
  target: decimal("target", { precision: 10, scale: 5 }),
  stopLoss: decimal("stop_loss", { precision: 10, scale: 5 }),
  slPips: decimal("sl_pips", { precision: 10, scale: 1 }),
  tpPips: decimal("tp_pips", { precision: 10, scale: 1 }),
  rr: decimal("rr", { precision: 10, scale: 2 }),
  result: varchar("result").notNull(),
  pnl: decimal("pnl", { precision: 12, scale: 2 }),
  emotion: varchar("emotion"),
  confluencesPro: text("confluences_pro").array(),
  confluencesContro: text("confluences_contro").array(),
  imageUrls: text("image_urls").array(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  createdAt: true,
});

export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;

export const tradingDiary = pgTable("trading_diary", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: varchar("date").notNull(),
  content: text("content"),
  mood: varchar("mood"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDiarySchema = createInsertSchema(tradingDiary).omit({
  id: true,
  createdAt: true,
});

export type InsertDiary = z.infer<typeof insertDiarySchema>;
export type TradingDiary = typeof tradingDiary.$inferSelect;

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  targetTrades: integer("target_trades"),
  targetWinRate: decimal("target_win_rate", { precision: 5, scale: 2 }),
  targetProfit: decimal("target_profit", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true,
});

export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;