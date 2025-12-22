import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  serial,
  text,
  integer,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with roles and authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("user"), // super_admin, admin, user
  isApproved: varchar("is_approved").notNull().default("pending"), // pending, approved, rejected
  initialCapital: real("initial_capital").default(10000),
  resetToken: varchar("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Registration schema for new users
export const registerUserSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri"),
  firstName: z.string().min(1, "Nome richiesto"),
  lastName: z.string().min(1, "Cognome richiesto"),
});

export type RegisterUser = z.infer<typeof registerUserSchema>;

// Login schema
export const loginUserSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(1, "Password richiesta"),
});

export type LoginUser = z.infer<typeof loginUserSchema>;

// Trades table connected to users
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: varchar("date").notNull(),
  time: varchar("time"),
  pair: varchar("pair").notNull(),
  direction: varchar("direction").notNull(), // long, short
  target: real("target"),
  stopLoss: real("stop_loss"),
  slPips: real("sl_pips"), // Stop loss in pips
  tpPips: real("tp_pips"), // Take profit in pips
  rr: real("rr"), // Risk/Reward ratio
  result: varchar("result").notNull(), // win, loss, breakeven
  pnl: real("pnl"),
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

// Trading diary for daily notes
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

// Monthly goals
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  targetTrades: integer("target_trades"),
  targetWinRate: real("target_win_rate"),
  targetProfit: real("target_profit"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true,
});

export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;
