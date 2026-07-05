"use client";

import { useId } from "react";
import { Plant } from "@/components/garden/Plant";
import { Cat, type CatMood } from "@/components/garden/Cat";
import { GROUND_PALETTE, SOIL_PALETTE, STONE_PALETTE, darken, lighten } from "@/components/garden/colour";
import type { GardenItem } from "@/lib/pattern-garden-storage";

export const BED_CAPACITY = 12;
const COLS = 3;
const ROWS = 4;

export interface GardenBedProps {
  items: GardenItem[];
  bedIndex: number;
}

// The bed's milestone stage - how far this plot has come, not how many
// blooms are literally in it. Drives groundcover, path, and feature reveals.
type Stage = 0 | 1 | 2 | 3 | 4;

function stageFor(count: number): Stage {
  if (count <= 0) return 0;
  if (count <= 3) return 1;
  if (count <= 7) return 2;
  if (count <= 11) return 3;
  return 4;
}

// She reacts to how settled the bed feels, not to an exact count - curious
// while it's filling in, properly curled up once it's nearly done.
function catMoodFor(count: number): CatMood {
  if (count === 0) return "napping";
  if (count < 8) return "alert";
  return "curled";
}

function formatPlantedOn(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Small deterministic per-cell lean so a full grid of blooms reads as
// planted-by-hand rather than a stamped-out pattern.
function leanFor(index: number): number {
  return [-5, 3, -2, 6, -4, 2, 5, -3, 4, -6, 3, -2][index % 12];
}

// Fixed, hand-placed soil patches that thin out as the bed fills in - never
// random, so the bed doesn't visually shuffle between renders.
const SOIL_PATCHES: Record<1 | 2 | 3, { x: number; y: number; rx: number; ry: number }[]> = {
  1: [
    { x: 18, y: 20, rx: 15, ry: 8 },
    { x: 78, y: 15, rx: 13, ry: 7 },
    { x: 12, y: 55, rx: 12, ry: 7 },
    { x: 55, y: 40, rx: 16, ry: 8 },
    { x: 88, y: 60, rx: 12, ry: 7 },
    { x: 40, y: 78, rx: 14, ry: 7 },
  ],
  2: [
    { x: 22, y: 22, rx: 12, ry: 6 },
    { x: 82, y: 45, rx: 11, ry: 6 },
    { x: 45, y: 72, rx: 12, ry: 6 },
  ],
  3: [{ x: 70, y: 25, rx: 10, ry: 5 }],
};

function BedGround({ stage, uid }: { stage: Stage; uid: string }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${uid}-ground`} cx="35%" cy="20%" r="90%">
          <stop offset="0%" stopColor={GROUND_PALETTE.light} />
          <stop offset="100%" stopColor={GROUND_PALETTE.base} />
        </radialGradient>
        <radialGradient id={`${uid}-tilled`} cx="40%" cy="30%" r="80%">
          <stop offset="0%" stopColor={SOIL_PALETTE.light} />
          <stop offset="100%" stopColor={SOIL_PALETTE.base} />
        </radialGradient>
      </defs>

      <rect x={0} y={0} width={100} height={100} fill={`url(#${uid}-ground)`} />

      {stage >= 1 && (
        <>
          <ellipse cx={15} cy={12} rx={20} ry={10} fill={GROUND_PALETTE.dark} opacity={0.14} />
          <ellipse cx={85} cy={35} rx={22} ry={12} fill={GROUND_PALETTE.light} opacity={0.22} />
          <ellipse cx={30} cy={85} rx={24} ry={11} fill={GROUND_PALETTE.dark} opacity={0.12} />
        </>
      )}

      {(stage === 1 || stage === 2 || stage === 3) &&
        SOIL_PATCHES[stage].map((p, i) => (
          <ellipse key={i} cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} fill={SOIL_PALETTE.base} opacity={0.4} />
        ))}
    </svg>
  );
}

// Rendered as real HTML (not the stretched SVG above) so its rounded corners
// and furrow rows stay true to the bed's actual aspect ratio instead of
// warping into a stretched pill shape.
function TilledSoil() {
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        inset: "13% 13%",
        borderRadius: "8%",
        backgroundImage: `repeating-linear-gradient(180deg, transparent 0, transparent 14%, rgba(74,50,30,0.22) 14%, rgba(74,50,30,0.22) 17%), radial-gradient(120% 90% at 40% 25%, ${SOIL_PALETTE.light} 0%, ${SOIL_PALETTE.base} 100%)`,
      }}
    />
  );
}

function SteppingPath({ uid }: { uid: string }) {
  const stones = [10, 30, 50, 70, 90];
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 bottom-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${uid}-stone`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor={STONE_PALETTE.light} />
          <stop offset="100%" stopColor={STONE_PALETTE.base} />
        </radialGradient>
      </defs>
      {stones.map((x, i) => (
        <ellipse
          key={x}
          cx={x}
          cy={92 + (i % 2 === 0 ? 1.5 : -1.5)}
          rx={5.5}
          ry={2.4}
          fill={`url(#${uid}-stone)`}
          opacity={0.9}
        />
      ))}
    </svg>
  );
}

type FeatureKind = "tree" | "birdbath" | "bench";

function LittleTree({ uid, lush }: { uid: string; lush: boolean }) {
  return (
    <svg viewBox="0 0 60 70" className="h-full w-full" role="img" aria-label="A little tree">
      <defs>
        <radialGradient id={`${uid}-canopy`} cx="35%" cy="25%" r="85%">
          <stop offset="0%" stopColor={GROUND_PALETTE.light} />
          <stop offset="100%" stopColor={GROUND_PALETTE.dark} />
        </radialGradient>
      </defs>
      <path d="M28,68 L26,42 Q26,36 30,36 Q34,36 34,42 L32,68 Z" fill={SOIL_PALETTE.dark} />
      <circle cx={30} cy={26} r={19} fill={`url(#${uid}-canopy)`} />
      <circle cx={17} cy={33} r={11} fill={GROUND_PALETTE.base} opacity={0.9} />
      <circle cx={44} cy={31} r={12} fill={GROUND_PALETTE.dark} opacity={0.85} />
      {lush &&
        [
          { x: 18, y: 20 },
          { x: 38, y: 14 },
          { x: 44, y: 30 },
          { x: 22, y: 36 },
        ].map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.1} fill="#F4C7A1" opacity={0.9} />
        ))}
    </svg>
  );
}

function Birdbath({ uid, lush }: { uid: string; lush: boolean }) {
  return (
    <svg viewBox="0 0 60 70" className="h-full w-full" role="img" aria-label="A birdbath">
      <defs>
        <radialGradient id={`${uid}-bath`} cx="35%" cy="25%" r="85%">
          <stop offset="0%" stopColor={STONE_PALETTE.light} />
          <stop offset="100%" stopColor={STONE_PALETTE.dark} />
        </radialGradient>
      </defs>
      <rect x={26} y={38} width={8} height={26} rx={2.5} fill={STONE_PALETTE.dark} />
      <ellipse cx={30} cy={64} rx={13} ry={3.6} fill={STONE_PALETTE.deep} opacity={0.5} />
      <ellipse cx={30} cy={34} rx={22} ry={9} fill={`url(#${uid}-bath)`} />
      <ellipse cx={30} cy={33} rx={16} ry={5.6} fill="#CFE3E0" opacity={0.8} />
      {lush && (
        <>
          <path d="M22,33 q4,-2.4 8,0" stroke="#fff" strokeOpacity={0.6} strokeWidth={0.9} fill="none" strokeLinecap="round" />
          <path d="M32,32 q4,-2 7,0.4" stroke="#fff" strokeOpacity={0.5} strokeWidth={0.9} fill="none" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function GardenBench({ uid, lush }: { uid: string; lush: boolean }) {
  return (
    <svg viewBox="0 0 60 70" className="h-full w-full" role="img" aria-label="A little bench">
      <defs>
        <linearGradient id={`${uid}-wood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SOIL_PALETTE.light} />
          <stop offset="100%" stopColor={SOIL_PALETTE.dark} />
        </linearGradient>
      </defs>
      <rect x={8} y={30} width={44} height={5} rx={2} fill={`url(#${uid}-wood)`} />
      <rect x={8} y={16} width={44} height={5} rx={2} fill={`url(#${uid}-wood)`} />
      <rect x={12} y={16} width={4} height={22} fill={SOIL_PALETTE.dark} opacity={0.8} />
      <rect x={44} y={16} width={4} height={22} fill={SOIL_PALETTE.dark} opacity={0.8} />
      <rect x={10} y={35} width={5} height={20} fill={SOIL_PALETTE.deep} />
      <rect x={45} y={35} width={5} height={20} fill={SOIL_PALETTE.deep} />
      {lush && (
        <>
          <path d="M6,12 L18,12 L12,20 Z" fill="#C3A6D8" opacity={0.85} />
          <path d="M22,10 L34,10 L28,18 Z" fill="#F4A261" opacity={0.85} />
          <path d="M38,12 L50,12 L44,20 Z" fill="#A8D5BA" opacity={0.85} />
        </>
      )}
    </svg>
  );
}

function BedFeature({ kind, uid, lush }: { kind: FeatureKind; uid: string; lush: boolean }) {
  return (
    <div className="animate-bloom-in absolute bottom-[6%] right-[8%] h-[22%] w-[20%] max-w-[64px]">
      {kind === "tree" && <LittleTree uid={uid} lush={lush} />}
      {kind === "birdbath" && <Birdbath uid={uid} lush={lush} />}
      {kind === "bench" && <GardenBench uid={uid} lush={lush} />}
    </div>
  );
}

export function GardenBed({ items, bedIndex }: GardenBedProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const count = items.length;
  const stage = stageFor(count);
  const featureKind: FeatureKind = (["tree", "birdbath", "bench"] as const)[bedIndex % 3];

  const frameGradient = `linear-gradient(155deg, ${lighten(SOIL_PALETTE.base, 0.08)} 0%, ${SOIL_PALETTE.dark} 55%, ${SOIL_PALETTE.deep} 100%)`;
  const emptyCaptionColour = darken(SOIL_PALETTE.dark, 0.1);

  return (
    <div className="flex h-full w-full flex-col gap-2 px-1">
      <div
        className="relative min-h-0 flex-1 rounded-[26px] p-[9px] shadow-[0_10px_24px_rgba(90,60,30,0.18)]"
        style={{ background: frameGradient }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-[19px]">
          <BedGround stage={stage} uid={uid} />
          {stage === 0 && <TilledSoil />}
          {stage >= 2 && <SteppingPath uid={uid} />}
          {stage >= 3 && <BedFeature kind={featureKind} uid={uid} lush={stage === 4} />}

          <Cat
            mood={catMoodFor(count)}
            size={50}
            className="absolute bottom-[5%] left-[6%]"
            style={{ transformOrigin: "bottom center" }}
          />

          <div
            className="absolute inset-x-[6%] top-[6%] bottom-[24%] grid gap-x-1 gap-y-0"
            style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}
          >
            {Array.from({ length: BED_CAPACITY }).map((_, i) => {
              const item = items[i];
              return (
                <div key={i} className="flex items-center justify-center">
                  {item && (
                    <div
                      className="animate-bloom-in flex h-[82%] w-[82%] items-center justify-center"
                      style={{ transform: `rotate(${leanFor(i)}deg)` }}
                      title={formatPlantedOn(item.timestamp)}
                    >
                      <Plant species={item.species} colour={item.colour} showSoil={false} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {count === 0 && (
            <p
              className="absolute inset-x-[12%] top-[46%] text-center text-sm font-medium"
              style={{ color: emptyCaptionColour }}
            >
              Nothing&apos;s grown here yet - plant your first seedling.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
