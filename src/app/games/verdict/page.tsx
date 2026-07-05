import { BackButton } from "@/components/layout/BackButton";

export default function VerdictGamePage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <BackButton />
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-card bg-surface p-12 text-center">
        <span className="text-4xl">⚖️</span>
        <h1 className="text-2xl font-semibold text-text">Verdict</h1>
        <p className="text-text-light">Coming soon.</p>
      </div>
    </div>
  );
}
