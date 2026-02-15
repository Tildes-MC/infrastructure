import { useCallback, useEffect, useRef, useState } from "react";
import { useServerContext } from "@/components/ServerContext";
import { cn } from "@/util/classname";
import type { ServerStatusResponse } from "@/util/mc-ping";

function notificationBody(status: ServerStatusResponse) {
  if (status.players.online === 1 && status.players.sample.length === 1) {
    return `${status.players.sample[0].name} just joined the server`;
  } else if (status.players.online === status.players.sample.length) {
    const playerNames = status.players.sample.map((player) => player.name);
    const lastPlayer = playerNames.pop();
    return `${[...playerNames, "and", lastPlayer].join(", ")} are playing on the server`;
  }

  return `${status.players.online} players are on the server`;
}

export function NotifyButton() {
  const { serverData } = useServerContext();
  const [isNotifying, setIsNotifying] = useState(false);
  const lastPlayerCountRef = useRef<number>(0);

  const isServerOnline = serverData.online;
  const currentPlayerCount = serverData.online
    ? serverData.status.players.online
    : 0;
  const favicon = serverData.online ? serverData.status.favicon : undefined;

  const sendNotification = useCallback(
    (status: ServerStatusResponse) => {
      new Notification("New player is online!", {
        body: notificationBody(status),
        icon: favicon || "/favicon-32x32.png",
      });
    },
    [favicon],
  );

  const reset = useCallback(() => {
    setIsNotifying(false);
    lastPlayerCountRef.current = 0;
  }, []);

  // Watch for player count changes when notifying is enabled
  useEffect(() => {
    if (!isNotifying) return;
    if (!isServerOnline) return;

    const newPlayerCount = serverData.status.players.online;
    if (newPlayerCount <= lastPlayerCountRef.current) return;

    sendNotification(serverData.status);
    reset();
  }, [isNotifying, isServerOnline, serverData, sendNotification, reset]);

  useEffect(() => {
    if (isNotifying && !isServerOnline) {
      reset();
    }
  }, [isNotifying, isServerOnline, reset]);

  const handleClick = async () => {
    if (isNotifying) {
      reset();
      return;
    }

    if (!("Notification" in window)) {
      alert("This browser does not support notifications");
      return;
    }

    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();

      if (permission === "granted") {
        new Notification("Notifications enabled", {
          icon: favicon || "/favicon-32x32.png",
        });
      }
    }

    if (permission !== "granted") {
      alert("Notification permission was denied");
      return;
    }

    lastPlayerCountRef.current = currentPlayerCount;
    setIsNotifying(true);
  };

  const isDisabled = !isServerOnline;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={
        /* prettier-ignore */ cn(
          "font-bold py-3 px-6 rounded focus:outline-hidden focus:shadow-outline max-w-md w-full text-center",
          isDisabled
            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
            : isNotifying
              ? "bg-red-500 hover:bg-red-700 text-white cursor-pointer"
              : "bg-green-500 hover:bg-green-700 text-white cursor-pointer",
        )
      }
    >
      {isNotifying ? "Stop notifications" : "Notify me when someone joins"}
    </button>
  );
}
