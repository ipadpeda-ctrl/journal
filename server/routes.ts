import type { Express, RequestHandler } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTradeSchema, insertDiarySchema, insertGoalSchema } from "@shared/schema";

// Middleware to check admin role
const isAdmin: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  if (!user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const dbUser = await storage.getUser(user.claims.sub);
  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "super_admin")) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  next();
};

// Middleware to check super_admin role
const isSuperAdmin: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  if (!user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const dbUser = await storage.getUser(user.claims.sub);
  if (!dbUser || dbUser.role !== "super_admin") {
    return res.status(403).json({ message: "Forbidden: Super Admin access required" });
  }
  next();
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user's initial capital
  app.patch("/api/auth/user/capital", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { initialCapital } = req.body;
      
      if (typeof initialCapital !== "number" || initialCapital < 0) {
        return res.status(400).json({ message: "Invalid capital value" });
      }
      
      const user = await storage.updateUserCapital(userId, initialCapital);
      res.json(user);
    } catch (error) {
      console.error("Error updating capital:", error);
      res.status(500).json({ message: "Failed to update capital" });
    }
  });

  // ============== TRADE ROUTES ==============
  
  // Get current user's trades
  app.get("/api/trades", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trades = await storage.getTradesByUser(userId);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  // Create a new trade
  app.post("/api/trades", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tradeData = insertTradeSchema.parse({ ...req.body, userId });
      const trade = await storage.createTrade(tradeData);
      res.status(201).json(trade);
    } catch (error) {
      console.error("Error creating trade:", error);
      res.status(400).json({ message: "Failed to create trade" });
    }
  });

  // Update a trade
  app.patch("/api/trades/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const trade = await storage.updateTrade(id, userId, req.body);
      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      res.json(trade);
    } catch (error) {
      console.error("Error updating trade:", error);
      res.status(400).json({ message: "Failed to update trade" });
    }
  });

  // Delete a trade
  app.delete("/api/trades/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTrade(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Trade not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting trade:", error);
      res.status(500).json({ message: "Failed to delete trade" });
    }
  });

  // ============== DIARY ROUTES ==============
  
  app.get("/api/diary", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const diary = await storage.getDiaryByUser(userId);
      res.json(diary);
    } catch (error) {
      console.error("Error fetching diary:", error);
      res.status(500).json({ message: "Failed to fetch diary" });
    }
  });

  app.post("/api/diary", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const diaryData = insertDiarySchema.parse({ ...req.body, userId });
      const diary = await storage.upsertDiary(diaryData);
      res.status(201).json(diary);
    } catch (error) {
      console.error("Error saving diary:", error);
      res.status(400).json({ message: "Failed to save diary" });
    }
  });

  app.delete("/api/diary/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDiary(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Diary entry not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting diary:", error);
      res.status(500).json({ message: "Failed to delete diary" });
    }
  });

  // ============== GOAL ROUTES ==============
  
  app.get("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goals = await storage.getGoalsByUser(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goalData = insertGoalSchema.parse({ ...req.body, userId });
      const goal = await storage.upsertGoal(goalData);
      res.status(201).json(goal);
    } catch (error) {
      console.error("Error saving goal:", error);
      res.status(400).json({ message: "Failed to save goal" });
    }
  });

  app.delete("/api/goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteGoal(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Goal not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting goal:", error);
      res.status(500).json({ message: "Failed to delete goal" });
    }
  });

  // ============== ADMIN ROUTES ==============
  
  // Get all users (admin only)
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get all trades (admin only)
  app.get("/api/admin/trades", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const trades = await storage.getAllTrades();
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  // Update user role (super_admin only)
  app.patch("/api/admin/users/:id/role", isAuthenticated, isSuperAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      // Prevent changing super_admin role
      const targetUser = await storage.getUser(id);
      if (targetUser?.role === "super_admin") {
        return res.status(403).json({ message: "Cannot change super admin role" });
      }
      
      const user = await storage.updateUserRole(id, role);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  return httpServer;
}
