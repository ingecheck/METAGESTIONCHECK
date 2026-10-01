import type { Request, Response } from "express";

// Load server application handlers
let appInstance: any = null;

async function getApp() {
  if (!appInstance) {
    const serverModule = await import("../server.js" as any).catch(async () => {
      return await import("../dist/server.cjs" as any);
    });
    appInstance = serverModule.default || serverModule.app || serverModule;
  }
  return appInstance;
}

export default async function handler(req: Request, res: Response) {
  const app = await getApp();
  if (typeof app === "function") {
    return app(req, res);
  }
  return res.status(500).json({ error: "Server handler not available" });
}
