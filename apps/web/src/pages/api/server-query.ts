import type { NextApiRequest, NextApiResponse } from "next";
import type { ServerQueryResponse } from "@/api-types";
import { pingServer } from "@/util/mc-ping";

const CACHE_MAX_AGE = 60; // seconds
const CACHE_STALE_WHILE_REVALIDATE = 60; // seconds

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ServerQueryResponse>,
) {
  if (req.method !== "GET") {
    res
      .status(200)
      .json({ success: false, message: "Only GET requests are allowed" });
    return;
  }

  const host = process.env.RCON_HOST;
  if (!host) {
    res
      .status(200)
      .json({ success: false, message: "Server is not configured correctly" });
    return;
  }

  const result = await pingServer(host);
  res.setHeader(
    "Cache-Control",
    `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE}`,
  );
  res.status(200).json({ success: true, status: result });
}
