import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTradeSchema, insertDiarySchema, insertGoalSchema } from "@shared/schema";
import { setupAuth } from "./replitAuth"; // or "./localAuth" based on your setup setupAuth(app);

export async function registerRoutes(app: Express): Promise<Server> {
  // Nota: Assicurati che setupAuth sia configurato correttamente (Sessioni, Passport, etc.)
  // setupAuth(app); 

  // --- TRADES ---
  app.get("/api/trades", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const trades = await storage.getTrades(req.user!.id);
    res.json(trades);
  });

  app.post("/api/trades", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parseResult = insertTradeSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json(parseResult.error);
    
    const trade = await storage.createTrade({ ...parseResult.data, userId: req.user!.id });
    res.status(201).json(trade);
  });

  app.patch("/api/trades/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const parseResult = insertTradeSchema.partial().safeParse(req.body);
    if (!parseResult.success) return res.status(400).json(parseResult.error);

    const trade = await storage.updateTrade(id, parseResult.data);
    res.json(trade);
  });

  app.delete("/api/trades/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    await storage.deleteTrade(id);
    res.sendStatus(200);
  });

  // --- USER SETTINGS & PREFERENCES ---
  app.patch("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Gestione aggiornamento preferenze e capitale
    const updateData: any = {};
    if (req.body.initialCapital) updateData.initialCapital = req.body.initialCapital; // Sarà una stringa decimal
    if (req.body.preferences) updateData.preferences = req.body.preferences; // JSON object

    if (Object.keys(updateData).length === 0) return res.sendStatus(400);

    const updatedUser = await storage.updateUser(req.user!.id, updateData);
    res.json(updatedUser);
  });

  // --- DIARY ---
  app.get("/api/diary", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const entries = await storage.getDiaryEntries(req.user!.id);
    res.json(entries);
  });

  app.post("/api/diary", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parseResult = insertDiarySchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json(parseResult.error);
    
    const entry = await storage.createDiaryEntry({ ...parseResult.data, userId: req.user!.id });
    res.status(201).json(entry);
  });

  // --- GOALS ---
  app.get("/api/goals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const goals = await storage.getGoals(req.user!.id);
    res.json(goals);
  });

  app.post("/api/goals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parseResult = insertGoalSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json(parseResult.error);

    const goal = await storage.createGoal({ ...parseResult.data, userId: req.user!.id });
    res.status(201).json(goal);
  });

  const httpServer = createServer(app);
  return httpServer;
}