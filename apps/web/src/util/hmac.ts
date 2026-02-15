import crypto from "node:crypto";

export const slotDuration = 5 * 60 * 1000; // milliseconds
export const hmacLength = 16;

export function computeHMAC(
  mcUsername: string,
  tildesUsername: string,
  date: number,
  secret: string,
) {
  // Round off the timestamp to the nearest slot
  const timestamp = Math.round(date / slotDuration) * slotDuration;

  return crypto
    .createHmac("sha256", secret)
    .update(`${mcUsername}:${tildesUsername}:${timestamp}`)
    .digest("hex")
    .slice(0, hmacLength);
}
