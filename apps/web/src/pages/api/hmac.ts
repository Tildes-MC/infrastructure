import type { NextApiRequest, NextApiResponse } from "next";
import type { HMACRequest, HMACResponse } from "@/api-types";
import { computeHMAC } from "@/util/hmac";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HMACResponse>,
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

  const secret = process.env.USERNAME_SECRET;
  if (!secret) {
    res
      .status(200)
      .json({ success: false, message: "Server is not configured correctly" });
    return;
  }

  const body: unknown = req.body;
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    res.status(200).json({ success: false, message: "Invalid request body" });
    return;
  }

  const { mcUsername, tildesUsername } = body as HMACRequest;
  if (typeof mcUsername !== "string") {
    res
      .status(200)
      .json({ success: false, message: "Missing Minecraft username" });
    return;
  }
  if (typeof tildesUsername !== "string") {
    res
      .status(200)
      .json({ success: false, message: "Missing Tildes username" });
    return;
  }

  if (!/^[a-zA-Z0-9_]{3,16}$/.test(mcUsername)) {
    res
      .status(200)
      .json({ success: false, message: "Invalid Minecraft username" });
    return;
  }
  if (!/^[a-zA-Z0-9_-]{2,255}$/.test(tildesUsername)) {
    res
      .status(200)
      .json({ success: false, message: "Invalid Tildes username" });
    return;
  }

  const hmac = computeHMAC(mcUsername, tildesUsername, Date.now(), secret);
  res.status(200).json({ success: true, hmac });
}
