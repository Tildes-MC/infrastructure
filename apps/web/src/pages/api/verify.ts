import { timingSafeEqual } from "node:crypto";
import { JSDOM } from "jsdom";
import type { NextApiRequest, NextApiResponse } from "next";
import { Rcon } from "rcon-client";
import type { VerifyRequest, VerifyResponse } from "@/api-types";
import { computeHMAC, hmacLength, slotDuration } from "@/util/hmac";
import type { TextComponent } from "@/util/mc-component";

class RCONError extends Error {}

async function parseBio(tildesUsername: string) {
  const response = await fetch(`https://tildes.net/user/${tildesUsername}`);
  const dom = new JSDOM(await response.text());
  return dom.window.document.querySelector("div.user-bio")?.textContent ?? "";
}

async function applyNickname(mcUsername: string, nickname: string) {
  console.log(`Assigning nickname:${nickname} to ign:${mcUsername}`);

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
    if (check.includes("failed")) {
      throw new RCONError("You must be on the server to change your nickname");
    }

    const group = "player";
    await rcon.send(`lp user ${mcUsername} parent add ${group}`);

    await rcon.send(`whitelist add ${mcUsername}`);

    const color = "#0099CC";
    await rcon.send(`nickother ${mcUsername} <${color}>${nickname}`);

    await rcon.send(
      `tellraw ${mcUsername} ${JSON.stringify({
        text: "Your account has been verified and you now have build access!",
        color: "green",
        bold: true,
        italic: true,
      } satisfies TextComponent)}`,
    );

    await rcon.send(
      `tellraw @a ${JSON.stringify([
        {
          text: `${mcUsername} is `,
          color: "yellow",
        },
        {
          text: "@",
          color: "white",
        },
        {
          text: nickname,
          color: color,
        },
        {
          text: " on Tildes",
          color: "yellow",
        },
      ] satisfies TextComponent)}`,
    );
  } finally {
    await rcon.end();
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyResponse>,
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

  const secret = process.env.USERNAME_SECRET ?? "";
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

  const { mcUsername, tildesUsername } = body as VerifyRequest;
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

  let bio: string;

  try {
    bio = await parseBio(tildesUsername);
  } catch (_error) {
    res
      .status(200)
      .json({ success: false, message: "Could not read user bio" });
    return;
  }

  const hmac = bio.match(
    new RegExp(`MCValidation:([a-f0-9]{${hmacLength}})`),
  )?.[1];
  if (!hmac) {
    res
      .status(200)
      .json({ success: false, message: 'Could not find "MCValidation"' });
    return;
  }

  // Check if the HMAC matches the current time slot, or the adjacent slots to
  // account for clock inconsistencies and user delays.
  const now = Date.now();
  const hmacMatches =
    timingSafeEqual(
      Buffer.from(hmac),
      Buffer.from(
        computeHMAC(mcUsername, tildesUsername, now - slotDuration, secret),
      ),
    ) ||
    timingSafeEqual(
      Buffer.from(hmac),
      Buffer.from(computeHMAC(mcUsername, tildesUsername, now, secret)),
    ) ||
    timingSafeEqual(
      Buffer.from(hmac),
      Buffer.from(
        computeHMAC(mcUsername, tildesUsername, now + slotDuration, secret),
      ),
    );

  if (!hmacMatches) {
    res.status(200).json({ success: false, message: 'Invalid "MCValidation"' });
    return;
  }

  try {
    await applyNickname(mcUsername, tildesUsername);
  } catch (error) {
    if (error instanceof RCONError) {
      res.status(200).json({ success: false, message: error.message });
      return;
    }

    res
      .status(200)
      .json({ success: false, message: "Could not apply nickname" });
    return;
  }

  res.status(200).json({ success: true });
}
