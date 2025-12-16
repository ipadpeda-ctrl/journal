import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      role: string;
      isApproved: string;
    }
  }
}

export function setupLocalAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "trading-journal-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      pool,
      tableName: "sessions",
      createTableIfMissing: false,
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "lax",
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email.toLowerCase());
          
          if (!user) {
            return done(null, false, { message: "Email o password non corretti" });
          }

          if (!user.passwordHash) {
            return done(null, false, { message: "Account non configurato correttamente" });
          }

          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) {
            return done(null, false, { message: "Email o password non corretti" });
          }

          if (user.isApproved === "pending") {
            return done(null, false, { message: "Il tuo account è in attesa di approvazione" });
          }

          if (user.isApproved === "rejected") {
            return done(null, false, { message: "Il tuo account è stato rifiutato" });
          }

          return done(null, {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isApproved: user.isApproved,
          });
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isApproved: user.isApproved,
      });
    } catch (error) {
      done(error);
    }
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Non autenticato" });
};

export const isApproved: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && req.user?.isApproved === "approved") {
    return next();
  }
  res.status(403).json({ message: "Account non approvato" });
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Non autenticato" });
  }
  
  const user = await storage.getUser(req.user.id);
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return res.status(403).json({ message: "Accesso admin richiesto" });
  }
  next();
};

export const isSuperAdmin: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Non autenticato" });
  }
  
  const user = await storage.getUser(req.user.id);
  if (!user || user.role !== "super_admin") {
    return res.status(403).json({ message: "Accesso super admin richiesto" });
  }
  next();
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
