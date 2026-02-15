import * as net from "node:net";
import type { TextComponent } from "@/util/mc-component";

export interface ServerStatusResponse {
  version: {
    name: string;
    protocol: number;
  };
  players: {
    max: number;
    online: number;
    sample: { name: string; id: string }[];
  };
  description: TextComponent;
  /**
   * Base64 encoded data URL
   */
  favicon?: string;
}

export type PingResult =
  | { online: true; status: ServerStatusResponse }
  | { online: false };

function packVarInt(value: number): Buffer {
  const bytes: number[] = [];

  while (true) {
    const byte = value & 0x7f;
    value >>>= 7;
    bytes.push(value > 0 ? byte | 0x80 : byte);
    if (value === 0) break;
  }

  return Buffer.from(bytes);
}

function packData(data: Buffer): Buffer {
  return Buffer.concat([packVarInt(data.length), data]);
}

function packString(str: string): Buffer {
  const encoded = Buffer.from(str, "utf8");
  return Buffer.concat([packVarInt(encoded.length), encoded]);
}

function packPort(port: number): Buffer {
  const buf = Buffer.alloc(2);
  buf.writeUInt16BE(port);
  return buf;
}

function readVarInt(buffer: Buffer, offset: number): [number, number] {
  let value = 0;
  let position = 0;

  while (true) {
    const byte = buffer[offset + position];
    value |= (byte & 0x7f) << (7 * position);
    position++;
    if ((byte & 0x80) === 0) break;
    if (position >= 5) throw new Error("VarInt too big");
  }

  return [value, offset + position];
}

export async function pingServer(
  host: string,
  port: number = 25565,
  timeout: number = 5000,
): Promise<PingResult> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;
    const dataChunks: Buffer[] = [];

    const finish = (result: PingResult) => {
      if (resolved) return;

      resolved = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeout);
    socket.on("timeout", () => finish({ online: false }));
    socket.on("error", () => finish({ online: false }));

    socket.connect(port, host, () => {
      // Handshake: packetId(0x00) + protocol(0) + host + port + nextState(1=status)
      const handshake = packData(
        Buffer.concat([
          Buffer.from([0x00, 0x00]),
          packString(host),
          packPort(port),
          Buffer.from([0x01]),
        ]),
      );

      // Status request: just packetId(0x00)
      const statusRequest = packData(Buffer.from([0x00]));
      socket.write(Buffer.concat([handshake, statusRequest]));
    });

    let errorQuota = 10;

    socket.on("data", (chunk) => {
      dataChunks.push(chunk);
      const data = Buffer.concat(dataChunks);

      try {
        const [packetLen, afterLen] = readVarInt(data, 0);
        if (data.length < afterLen + packetLen) return; // Need more data

        const [_packetId, afterId] = readVarInt(data, afterLen);
        const [jsonLen, afterJsonLen] = readVarInt(data, afterId);
        const jsonStr = data
          .subarray(afterJsonLen, afterJsonLen + jsonLen)
          .toString("utf8");

        const status: ServerStatusResponse = JSON.parse(jsonStr);
        finish({ online: true, status });
      } catch (e) {
        // Potentially incomplete data, wait for more
        console.error("Error parsing ping response:", e);
        errorQuota--;

        if (errorQuota <= 0) {
          finish({ online: false });
        }
      }
    });
  });
}
