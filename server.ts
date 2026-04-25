import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON middleware
  app.use(express.json());

  // Proxy route for Prayer Times
  app.get("/api/prayer-times", async (req, res) => {
    try {
      const { year, month, lat, lng } = req.query;
      const url = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lng}&method=2`;
      console.log("Fetching prayer times:", url);
      const fetchRes = await fetch(url);
      const data = await fetchRes.json();
      res.json(data);
    } catch (error) {
      console.error("Proxy error (prayer):", error);
      res.status(500).json({ error: "Failed to proxy prayer times" });
    }
  });

  // Proxy route for Quran Verses
  app.get("/api/quran/verses", async (req, res) => {
    try {
      const { chapter } = req.query;
      const url = `https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${chapter}`;
      const fetchRes = await fetch(url);
      const data = await fetchRes.json();
      res.json(data);
    } catch (error) {
      console.error("Proxy error (quran verses):", error);
      res.status(500).json({ error: "Failed to proxy quran verses" });
    }
  });

  // Proxy route for Quran Audio
  app.get("/api/quran/audio", async (req, res) => {
    try {
      const { chapter } = req.query;
      const url = `https://api.quran.com/api/v4/recitations/4/by_chapter/${chapter}?per_page=300`;
      const fetchRes = await fetch(url);
      const data = await fetchRes.json();
      res.json(data);
    } catch (error) {
      console.error("Proxy error (quran audio):", error);
      res.status(500).json({ error: "Failed to proxy quran audio" });
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
    // Basic static serving if ever built to dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Express v5 'all' fallback instead of '*'
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
