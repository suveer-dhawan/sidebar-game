export interface Game {
  id: string;
  name: string;
  emoji: string;
  description: string;
  href: string;
  available: boolean;
}

export const GAMES: Game[] = [
  {
    id: "pattern",
    name: "Pattern Garden",
    emoji: "🌱",
    description: "Spot the pattern and grow your streak.",
    href: "/games/pattern",
    available: true,
  },
  {
    id: "verdict",
    name: "Verdict",
    emoji: "⚖️",
    description: "Weigh the evidence and call it.",
    href: "/games/verdict",
    available: false,
  },
  {
    id: "chart-check",
    name: "Chart Check",
    emoji: "📊",
    description: "Read the chart, catch what's off.",
    href: "/games/chart-check",
    available: false,
  },
  {
    id: "odd-one-out",
    name: "Odd One Out",
    emoji: "🔍",
    description: "Find the thing that doesn't belong.",
    href: "/games/odd-one-out",
    available: false,
  },
];
