import Link from "next/link";

export function BackButton() {
  return (
    <Link
      href="/"
      className="text-sm font-medium text-text-light transition-colors hover:text-text"
    >
      ← Home
    </Link>
  );
}
