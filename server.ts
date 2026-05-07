
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;
  const SCORES_FILE = path.join(process.cwd(), "scores.json");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

  if (supabase) {
    console.log("Using Supabase for local development");
  } else {
    console.log("Using local JSON file for scores (set SUPABASE_URL and SUPABASE_ANON_KEY in .env.local to use Supabase)");
  }

  app.use(express.json());

  // Ensure scores file exists for fallback
  try {
    await fs.access(SCORES_FILE);
  } catch {
    await fs.writeFile(SCORES_FILE, JSON.stringify([]));
  }

  // API for Leaderboard
  app.get("/api/scores", async (req, res) => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('leaderboard')
          .select('playerName, score, timestamp')
          .order('score', { ascending: false })
          .limit(10);
        if (error) throw error;
        return res.json(data);
      }

      const data = await fs.readFile(SCORES_FILE, "utf-8");
      const scores = JSON.parse(data);
      const top10 = scores.sort((a: any, b: any) => b.score - a.score).slice(0, 10);
      res.json(top10);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch scores" });
    }
  });

  app.post("/api/scores", async (req, res) => {
    try {
      const { playerName, score } = req.body;
      if (!playerName || typeof score !== "number") {
        return res.status(400).json({ error: "Invalid payload" });
      }

      if (supabase) {
        const { error } = await supabase
          .from('leaderboard')
          .insert([{ playerName, score, timestamp: new Date().toISOString() }]);
        if (error) throw error;
        return res.status(201).json({ success: true });
      }

      const data = await fs.readFile(SCORES_FILE, "utf-8");
      const scores = JSON.parse(data);
      
      scores.push({
        playerName,
        score,
        timestamp: Date.now()
      });

      await fs.writeFile(SCORES_FILE, JSON.stringify(scores));
      res.status(201).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to save score" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
