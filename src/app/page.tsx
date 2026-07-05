import Link from "next/link";
import { GAMES } from "@/lib/constants";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-16 sm:py-20">
      <div className="flex w-full max-w-md flex-col gap-10">
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-text">
            Sidebar
          </h1>
          <p className="text-text-light">a cozy corner for quiet little games</p>
        </header>

        <div className="grid grid-cols-2 gap-4">
          {GAMES.map((game) => {
            const cardBody = (
              <>
                <span className="text-5xl">{game.emoji}</span>
                <h2 className="text-base font-semibold text-text">
                  {game.name}
                </h2>
                <p className="text-sm leading-snug text-text-light">
                  {game.description}
                </p>
                {!game.available && (
                  <span className="mt-1 text-xs font-medium text-text-light">
                    Coming soon 🌱
                  </span>
                )}
              </>
            );

            if (game.available) {
              return (
                <Link
                  key={game.id}
                  href={game.href}
                  className="flex flex-col items-center gap-1.5 rounded-card bg-surface p-5 text-center shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                >
                  {cardBody}
                </Link>
              );
            }

            return (
              <div
                key={game.id}
                className="flex cursor-default flex-col items-center gap-1.5 rounded-card bg-surface p-5 text-center opacity-50 shadow-sm"
              >
                {cardBody}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
