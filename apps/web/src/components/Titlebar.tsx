import Link from "next/link";
import { useServerContext } from "@/components/ServerContext";
import { ArrowLeftIcon } from "@/icons/ArrowLeftIcon";
import { cn } from "@/util/classname";

interface TitlebarProps {
  showBack?: boolean;
}

export function Titlebar({ showBack }: TitlebarProps) {
  const { serverData } = useServerContext();
  const online = serverData?.online;

  return (
    <header className="bg-white border-b border-gray-300 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8">
            {showBack && (
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-700"
                aria-label="Back to home"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
            )}
          </div>
          <Link
            href="/"
            className="text-xl font-bold text-gray-800 hover:text-gray-600"
          >
            Tildes Minecraft
          </Link>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span
            className={cn(
              "inline-block w-2.5 h-2.5 rounded-full",
              online ? "bg-green-500" : "bg-red-500",
            )}
          />
          <span>{online ? "Online" : "Offline"}</span>
        </div>
      </div>
    </header>
  );
}
