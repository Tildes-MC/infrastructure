import { useCallback, useEffect } from "react";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import type { ServerQueryResponse } from "@/api-types";
import { Layout } from "@/components/Layout";
import { ServerProvider, useServerContext } from "@/components/ServerContext";
import type { PingResult } from "@/util/mc-ping";

const POLL_INTERVAL = 30000; // milliseconds

async function fetchServerStatus(): Promise<PingResult> {
  try {
    const response = await fetch("/api/server-query");
    const data: ServerQueryResponse = await response.json();
    if (!data.success) {
      throw new Error(data.message);
    }

    return data.status;
  } catch (e) {
    console.error("Failed to fetch server status:", e);
    return { online: false };
  }
}

function ServerPoller() {
  const { setServerData } = useServerContext();

  const update = useCallback(
    async () => setServerData(await fetchServerStatus()),
    [setServerData],
  );

  useEffect(() => {
    update();
    const interval = setInterval(update, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [update]);

  return null;
}

function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const showBack = router.pathname !== "/";

  return (
    <>
      <ServerPoller />
      <Layout showBack={showBack}>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}

export default function App(props: AppProps) {
  return (
    <ServerProvider>
      <AppContent {...props} />
    </ServerProvider>
  );
}
