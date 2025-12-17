import type { Express, RequestHandler } from "express";
import type { Server } from "http";
import passport from "passport";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { setupLocalAuth, isAuthenticated, isAdmin, isSuperAdmin, hashPassword } from "./localAuth";
import { insertTradeSchema, insertDiarySchema, insertGoalSchema, registerUserSchema, loginUserSchema } from "@shared/schema";
import { sendPasswordResetEmail } from "./email";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  setupLocalAuth(app);

  // ============== AUTH ROUTES ==============
  
  // Register new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerUserSchema.parse(req.body);
      
      // Check if email already exists
      const existing = await storage.getUserByEmail(data.email.toLowerCase());
      if (existing) {
        return res.status(400).json({ message: "Email già registrata" });
      }

      // Hash password and create user
      const passwordHash = await hashPassword(data.password);
      const user = await storage.createUser({
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      // If first user, auto-login (already approved as super_admin)
      if (user.role === "super_admin") {
        req.login({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isApproved: user.isApproved,
        }, (err) => {
          if (err) {
            return res.status(500).json({ message: "Errore durante il login" });
          }
          return res.status(201).json({ 
            message: "Registrazione completata! Sei il primo utente, quindi sei Super Admin.",
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              isApproved: user.isApproved,
            }
          });
        });
      } else {
        res.status(201).json({ 
          message: "Registrazione completata! Un admin dovrà approvare il tuo account.",
          pending: true
        });
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0]?.message || "Dati non validi" });
      }
      res.status(500).json({ message: "Errore durante la registrazione" });
    }
  });

  // Login
  app.post("/api/auth/login", (req, res, next) => {
    try {
      loginUserSchema.parse(req.body);
    } catch (error: any) {
      return res.status(400).json({ message: error.errors?.[0]?.message || "Dati non validi" });
    }

    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Errore durante il login" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Credenziali non valide" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Errore durante il login" });
        }
        res.json({ message: "Login effettuato", user });
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Errore durante il logout" });
      }
      res.json({ message: "Logout effettuato" });
    });
  });

  // Request password reset
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email richiesta" });
      }

      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        return res.json({ message: "Se l'email esiste, riceverai un link per il reset" });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 3600000);

      await storage.setResetToken(user.id, resetToken, expiry);

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const emailSent = await sendPasswordResetEmail(user.email, resetToken, baseUrl);

      if (!emailSent) {
        return res.status(500).json({ message: "Errore nell'invio dell'email. Verifica che RESEND_API_KEY sia configurata." });
      }

      res.json({ message: "Se l'email esiste, riceverai un link per il reset" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Errore durante la richiesta" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ message: "Token e password richiesti" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "La password deve avere almeno 6 caratteri" });
      }

      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Token non valido o scaduto" });
      }

      if (user.resetTokenExpiry && new Date() > user.resetTokenExpiry) {
        await storage.clearResetToken(user.id);
        return res.status(400).json({ message: "Token scaduto. Richiedi un nuovo reset." });
      }

      const passwordHash = await hashPassword(password);
      await storage.updateUserPassword(user.id, passwordHash);
      await storage.clearResetToken(user.id);

      res.json({ message: "Password aggiornata con successo" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Errore durante il reset" });
    }
  });

  // Change password (logged in user)
  app.post("/api/auth/change-password", isAuthenticated, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Password attuale e nuova richieste" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "La nuova password deve avere almeno 6 caratteri" });
      }

      const user = await storage.getUser(req.user.id);
      if (!user || !user.passwordHash) {
        return res.status(400).json({ message: "Utente non trovato" });
      }

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({ message: "Password attuale non corretta" });
      }

      const passwordHash = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, passwordHash);

      res.json({ message: "Password cambiata con successo" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Errore durante il cambio password" });
    }
  });

  // Get current user
  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Non autenticato" });
    }
    
    // Get full user data from database
    storage.getUser(req.user.id).then(user => {
      if (!user) {
        return res.status(404).json({ message: "Utente non trovato" });
      }
      // Don't send password hash
      const { passwordHash, ...safeUser } = user;
      res.json(safeUser);
    }).catch(error => {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Errore nel recupero utente" });
    });
  });

  // Update user's initial capital
  app.patch("/api/auth/user/capital", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { initialCapital } = req.body;
      
      if (typeof initialCapital !== "number" || initialCapital < 0) {
        return res.status(400).json({ message: "Valore capitale non valido" });
      }
      
      const user = await storage.updateUserCapital(userId, initialCapital);
      if (user) {
        const { passwordHash, ...safeUser } = user;
        res.json(safeUser);
      } else {
        res.status(404).json({ message: "Utente non trovato" });
      }
    } catch (error) {
      console.error("Error updating capital:", error);
      res.status(500).json({ message: "Errore nell'aggiornamento del capitale" });
    }
  });

  // ============== TRADE ROUTES ==============
  
  // Get current user's trades
  app.get("/api/trades", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const trades = await storage.getTradesByUser(userId);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ message: "Errore nel recupero trades" });
    }
  });

  // Create a new trade
  app.post("/api/trades", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tradeData = insertTradeSchema.parse({ ...req.body, userId });
      const trade = await storage.createTrade(tradeData);
      res.status(201).json(trade);
    } catch (error) {
      console.error("Error creating trade:", error);
      res.status(400).json({ message: "Errore nella creazione del trade" });
    }
  });

  // Update a trade
  app.patch("/api/trades/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const trade = await storage.updateTrade(id, userId, req.body);
      if (!trade) {
        return res.status(404).json({ message: "Trade non trovato" });
      }
      res.json(trade);
    } catch (error) {
      console.error("Error updating trade:", error);
      res.status(400).json({ message: "Errore nell'aggiornamento del trade" });
    }
  });

  // Delete a trade
  app.delete("/api/trades/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTrade(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Trade non trovato" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting trade:", error);
      res.status(500).json({ message: "Errore nell'eliminazione del trade" });
    }
  });

  // ============== DIARY ROUTES ==============
  
  app.get("/api/diary", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const diary = await storage.getDiaryByUser(userId);
      res.json(diary);
    } catch (error) {
      console.error("Error fetching diary:", error);
      res.status(500).json({ message: "Errore nel recupero del diario" });
    }
  });

  app.post("/api/diary", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const diaryData = insertDiarySchema.parse({ ...req.body, userId });
      const diary = await storage.upsertDiary(diaryData);
      res.status(201).json(diary);
    } catch (error) {
      console.error("Error saving diary:", error);
      res.status(400).json({ message: "Errore nel salvataggio del diario" });
    }
  });

  app.delete("/api/diary/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDiary(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Voce diario non trovata" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting diary:", error);
      res.status(500).json({ message: "Errore nell'eliminazione della voce" });
    }
  });

  // ============== GOAL ROUTES ==============
  
  app.get("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const goals = await storage.getGoalsByUser(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ message: "Errore nel recupero degli obiettivi" });
    }
  });

  app.post("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const goalData = insertGoalSchema.parse({ ...req.body, userId });
      const goal = await storage.upsertGoal(goalData);
      res.status(201).json(goal);
    } catch (error) {
      console.error("Error saving goal:", error);
      res.status(400).json({ message: "Errore nel salvataggio dell'obiettivo" });
    }
  });

  app.delete("/api/goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteGoal(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Obiettivo non trovato" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting goal:", error);
      res.status(500).json({ message: "Errore nell'eliminazione dell'obiettivo" });
    }
  });

  // ============== ADMIN ROUTES ==============
  
  // Get all users (admin only)
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't send password hashes
      const safeUsers = users.map(({ passwordHash, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Errore nel recupero utenti" });
    }
  });

  // Get all trades (admin only)
  app.get("/api/admin/trades", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const trades = await storage.getAllTrades();
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ message: "Errore nel recupero trades" });
    }
  });

  // Update user role (super_admin only)
  app.patch("/api/admin/users/:id/role", isAuthenticated, isSuperAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Ruolo non valido" });
      }
      
      // Prevent changing super_admin role
      const targetUser = await storage.getUser(id);
      if (targetUser?.role === "super_admin") {
        return res.status(403).json({ message: "Non puoi modificare il ruolo del super admin" });
      }
      
      const user = await storage.updateUserRole(id, role);
      if (!user) {
        return res.status(404).json({ message: "Utente non trovato" });
      }
      const { passwordHash, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Errore nell'aggiornamento del ruolo" });
    }
  });

  // Update user approval status (admin only)
  app.patch("/api/admin/users/:id/approval", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { isApproved } = req.body;
      
      if (!["approved", "rejected", "pending"].includes(isApproved)) {
        return res.status(400).json({ message: "Stato approvazione non valido" });
      }
      
      // Prevent changing super_admin approval
      const targetUser = await storage.getUser(id);
      if (targetUser?.role === "super_admin") {
        return res.status(403).json({ message: "Non puoi modificare lo stato del super admin" });
      }
      
      const user = await storage.updateUserApproval(id, isApproved);
      if (!user) {
        return res.status(404).json({ message: "Utente non trovato" });
      }
      const { passwordHash, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user approval:", error);
      res.status(500).json({ message: "Errore nell'aggiornamento dell'approvazione" });
    }
  });

  return httpServer;
}
