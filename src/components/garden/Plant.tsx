import { useId } from "react";
import type { Colour, Count, GrowthStage, Species } from "@/lib/pattern-engine";
import { BLOOM_HEADS } from "./blooms";
import { CORE_PALETTE, LEAF_PALETTE, SOIL_PALETTE, getBloomPalette } from "./colour";
import { BLOOM_ANCHORS, GROWTH_METRICS, STEM_LENGTH, lensPetal } from "./geometry";

export interface PlantProps {
  species?: Species;
  colour?: Colour;
  count?: Count;
  growthStage?: GrowthStage;
  size?: number;
  className?: string;
}

function Soil({ uid }: { uid: string }) {
  return (
    <g>
      <ellipse cx={50} cy={91} rx={33} ry={9} fill={SOIL_PALETTE.deep} opacity={0.55} />
      <ellipse cx={50} cy={87.5} rx={34} ry={10.5} fill={`url(#${uid}-soil)`} />
      <ellipse cx={45} cy={83.5} rx={19} ry={3.6} fill={SOIL_PALETTE.light} opacity={0.5} />
      {[-22, -9, 5, 16, 26].map((dx, i) => (
        <circle
          key={dx}
          cx={50 + dx}
          cy={87.5 + (i % 2 === 0 ? 2.4 : -1.6)}
          r={0.7}
          fill={SOIL_PALETTE.deep}
          opacity={0.4}
        />
      ))}
    </g>
  );
}

function EmptyMark() {
  return (
    <g>
      <circle
        cx={50}
        cy={82}
        r={15}
        fill="none"
        stroke={SOIL_PALETTE.dark}
        strokeOpacity={0.35}
        strokeWidth={1.5}
        strokeDasharray="3 4"
        strokeLinecap="round"
      />
      <text
        x={50}
        y={82}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={13}
        fontWeight={600}
        fill={SOIL_PALETTE.dark}
        fillOpacity={0.55}
        fontFamily="var(--font-sans), sans-serif"
      >
        ?
      </text>
      <title>Empty planting spot</title>
    </g>
  );
}

export function Plant({
  species,
  colour = "peach",
  count = 1,
  growthStage = "full-bloom",
  size = 88,
  className,
}: PlantProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const petal = getBloomPalette(colour);
  const metrics = GROWTH_METRICS[growthStage];
  const anchors = BLOOM_ANCHORS[count];
  const Head = species ? BLOOM_HEADS[species] : null;

  const label = species
    ? `${count} ${growthStage.replace("-", " ")} ${colour} ${species} bloom${count > 1 ? "s" : ""}`
    : "Empty planting spot";

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={label}
    >
      <defs>
        <radialGradient id={`${uid}-soil`} cx="40%" cy="30%" r="75%">
          <stop offset="0%" stopColor={SOIL_PALETTE.light} />
          <stop offset="100%" stopColor={SOIL_PALETTE.base} />
        </radialGradient>
        {species && (
          <>
            <linearGradient id={`${uid}-petal`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={petal.dark} />
              <stop offset="55%" stopColor={petal.base} />
              <stop offset="100%" stopColor={petal.light} />
            </linearGradient>
            <linearGradient id={`${uid}-leaf`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={LEAF_PALETTE.dark} />
              <stop offset="60%" stopColor={LEAF_PALETTE.base} />
              <stop offset="100%" stopColor={LEAF_PALETTE.light} />
            </linearGradient>
            <radialGradient id={`${uid}-core`} cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor={CORE_PALETTE.light} />
              <stop offset="100%" stopColor={CORE_PALETTE.dark} />
            </radialGradient>
            <linearGradient id={`${uid}-stem`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={LEAF_PALETTE.dark} />
              <stop offset="100%" stopColor={LEAF_PALETTE.base} />
            </linearGradient>
          </>
        )}
      </defs>

      <Soil uid={uid} />

      {species && Head ? (
        <g>
          {anchors.map((anchor, i) => {
            const stemLen = STEM_LENGTH * metrics.stemMul * anchor.scale;
            const lean = anchor.rotate * 0.35;
            const headX = anchor.x + lean;
            const headY = anchor.y - stemLen;
            const midX = anchor.x + lean * 0.5;
            const midY = anchor.y - stemLen * 0.55;
            const leafScale = metrics.leafScale * anchor.scale;

            return (
              <g key={i}>
                <path
                  d={`M${anchor.x},${anchor.y} Q${midX},${midY} ${headX},${headY}`}
                  stroke={`url(#${uid}-stem)`}
                  strokeWidth={1.6 * anchor.scale}
                  fill="none"
                  strokeLinecap="round"
                />
                <g
                  transform={`translate(${midX}, ${midY + 3}) rotate(${anchor.rotate * 0.6 - 30}) scale(${leafScale})`}
                >
                  <path d={lensPetal(2.2, 6)} fill={`url(#${uid}-leaf)`} />
                </g>
                <g
                  transform={`translate(${midX - 1}, ${midY - 1}) rotate(${anchor.rotate * 0.6 + 35}) scale(${leafScale * 0.85})`}
                >
                  <path d={lensPetal(2.2, 6)} fill={`url(#${uid}-leaf)`} />
                </g>
                <g
                  transform={`translate(${headX}, ${headY}) rotate(${anchor.rotate}) scale(${anchor.scale * metrics.headScale})`}
                >
                  <Head
                    stage={growthStage}
                    uid={uid}
                    petalPalette={petal}
                    leafPalette={LEAF_PALETTE}
                    corePalette={CORE_PALETTE}
                  />
                </g>
              </g>
            );
          })}
        </g>
      ) : (
        <EmptyMark />
      )}
    </svg>
  );
}
