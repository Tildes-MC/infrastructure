import type { PingResult } from "@/util/mc-ping";

export interface HMACRequest {
  mcUsername?: string;
  tildesUsername?: string;
}

export type HMACResponse =
  | { success: true; hmac: string }
  | { success: false; message: string };

export interface VerifyRequest {
  mcUsername?: string;
  tildesUsername?: string;
}

export type VerifyResponse =
  | { success: true }
  | { success: false; message: string };

export type ServerQueryResponse =
  | { success: true; status: PingResult }
  | { success: false; message: string };

export interface CheckOnlineRequest {
  mcUsername?: string;
}

export type CheckOnlineResponse =
  | { success: true; online: boolean }
  | { success: false; message: string };
