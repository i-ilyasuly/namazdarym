import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Proxy route for Prayer Times
  app.get("/api/prayer-times", async (req, res) => {
    try {
      const { year, lat, lng } = req.query;
      
      if (!year || !lat || !lng) {
        console.warn("[Proxy Warning] Missing parameters:", { year, lat, lng });
        return res.status(400).json({ error: "Missing required parameters" });
      }

      // 1. Fetch nearest city from Muftyat API
      const cityUrl = `https://api.muftyat.kz/cities/?lat=${lat}&lng=${lng}`;
      console.log(`[Proxy] Fetching nearest city: ${cityUrl}`);
      
      const cityRes = await axios.get(cityUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        },
        timeout: 20000
      });

      let targetLat = lat;
      let targetLng = lng;

      if (cityRes.data && cityRes.data.results && cityRes.data.results.length > 0) {
        targetLat = cityRes.data.results[0].lat;
        targetLng = cityRes.data.results[0].lng;
        console.log(`[Proxy] Found nearest city: ${cityRes.data.results[0].title} at ${targetLat}, ${targetLng}`);
      } else {
        console.log(`[Proxy] No nearby city found for ${lat}, ${lng}, using exact coords.`);
      }

      const url = `https://api.muftyat.kz/prayer-times/${year}/${targetLat}/${targetLng}`;
      console.log(`[Proxy] Fetching prayer times: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        },
        timeout: 20000 // 20 seconds
      });
      
      console.log(`[Proxy] Success fetching prayer times for ${year}`);
      res.json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      const message = error.message;
      console.error(`[Proxy Error] Prayer times (${status}):`, message);
      
      res.status(status).json({ 
        error: "Failed to fetch prayer times from Muftyat API", 
        details: message,
        status
      });
    }
  });

  // Proxy route for Quran Verses
  app.get("/api/quran/verses", async (req, res) => {
    try {
      const { chapter } = req.query;
      const url = `https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${chapter}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        }
      });
      res.json(response.data);
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
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        }
      });
      res.json(response.data);
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
