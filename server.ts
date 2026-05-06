
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const SCORES_FILE = path.join(process.cwd(), "scores.json");

  app.use(express.json());

  // Ensure scores file exists
  try {
    await fs.access(SCORES_FILE);
  } catch {
    await fs.writeFile(SCORES_FILE, JSON.stringify([]));
  }

  // API Mock for Cloudflare D1 Leaderboard
  app.get("/api/scores", async (req, res) => {
    try {
      const data = await fs.readFile(SCORES_FILE, "utf-8");
      const scores = JSON.parse(data);
      // Return top 10
      const top10 = scores.sort((a: any, b: any) => b.score - a.score).slice(0, 10);
      res.json(top10);
    } catch (err) {
      res.status(500).json({ error: "Failed to read scores" });
    }
  });

  app.post("/api/scores", async (req, res) => {
    try {
      const { playerName, score } = req.body;
      if (!playerName || typeof score !== "number") {
        return res.status(400).json({ error: "Invalid payload" });
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
