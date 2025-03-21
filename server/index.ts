import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./auth";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up authentication before routes
setupAuth(app);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Try a sequence of ports starting from 5000
    const ports = [5000, 5001, 5002];
    let lastError;

    for (const port of ports) {
      try {
        await new Promise<void>((resolve, reject) => {
          server.listen(port, "0.0.0.0")
            .once('listening', () => {
              console.log(`Server started on port ${port}`);
              log(`Server started on port ${port}`);
              resolve();
            })
            .once('error', (err) => {
              reject(err);
            });
        });
        // If we get here, the server started successfully
        return;
      } catch (err: any) {
        lastError = err;
        if (err.code === 'EADDRINUSE') {
          log(`Port ${port} is in use, trying next port...`);
          continue;
        }
        // If it's not EADDRINUSE, break the loop and throw
        throw err;
      }
    }

    // If we get here, all ports were in use
    throw lastError || new Error('All ports in use');
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();