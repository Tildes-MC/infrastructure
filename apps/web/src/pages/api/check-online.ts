import type { NextApiRequest, NextApiResponse } from "next";
import { Rcon } from "rcon-client";

import type { CheckOnlineRequest, CheckOnlineResponse } from "@/api-types";

class RCONError extends Error {}

async function checkPlayerOnline(mcUsername: string): Promise<boolean> {
  const host = process.env.RCON_HOST;
  if (!host) {
    throw new RCONError("Server is not configured correctly");
  }

  const password = process.env.RCON_PASSWORD;
  if (!password) {
    throw new RCONError("Server is not configured correctly");
  }

  const rcon = await Rcon.connect({
    host,
    port: parseInt(process.env.RCON_PORT || "25575", 10),
    password,
  });

  try {
    const check = await rcon.send(`execute if entity @p[name="${mcUsername}"]`);
    return !check.includes("failed");
  } finally {
    await rcon.end();
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CheckOnlineResponse>,
) {
  if (req.method !== "POST") {
    res
      .status(200)
      .json({ success: false, message: "Only POST requests are allowed" });
    return;
  }

  if (req.headers["content-type"] !== "application/json") {
    res.status(200).json({
      success: false,
      message: "Content-Type must be application/json",
    });
    return;
  }

  const body: unknown = req.body;
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    res.status(200).json({ success: false, message: "Invalid request body" });
    return;
  }

  const { mcUsername } = body as CheckOnlineRequest;
  if (typeof mcUsername !== "string") {
    res
      .status(200)
      .json({ success: false, message: "Missing Minecraft username" });
    return;
  }

  if (!/^[a-zA-Z0-9_]{3,16}$/.test(mcUsername)) {
    res
      .status(200)
      .json({ success: false, message: "Invalid Minecraft username" });
    return;
  }

  try {
    const online = await checkPlayerOnline(mcUsername);
    res.status(200).json({ success: true, online });
  } catch (error) {
    if (error instanceof RCONError) {
      res.status(200).json({ success: false, message: error.message });
      return;
    }

    res
      .status(200)
      .json({ success: false, message: "Could not check online status" });
  }
}
