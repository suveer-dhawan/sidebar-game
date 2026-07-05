import type { ReactElement } from "react";
import type { GrowthStage, Species } from "@/lib/pattern-engine";
import type { BloomPalette } from "./colour";
import { lensPetal, roundTipPetal } from "./geometry";

export interface BloomHeadProps {
  stage: GrowthStage;
  uid: string;
  petalPalette: BloomPalette;
  leafPalette: BloomPalette;
  corePalette: BloomPalette;
}

function PetalRing({
  n,
  startAngle,
  cy,
  d,
  fill,
}: {
  n: number;
  startAngle: number;
  cy: number;
  d: string;
  fill: string;
}) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <g key={i} transform={`translate(0, ${cy}) rotate(${startAngle + (360 / n) * i})`}>
          <path d={d} fill={fill} stroke="rgba(74,50,30,0.08)" strokeWidth={0.3} />
        </g>
      ))}
    </>
  );
}

function Petals({
  angles,
  cy,
  d,
  fill,
}: {
  angles: number[];
  cy: number;
  d: string;
  fill: string;
}) {
  return (
    <>
      {angles.map((angle, i) => (
        <g key={i} transform={`translate(0, ${cy}) rotate(${angle})`}>
          <path d={d} fill={fill} stroke="rgba(74,50,30,0.08)" strokeWidth={0.3} />
        </g>
      ))}
    </>
  );
}

function Daisy({ stage, uid }: BloomHeadProps) {
  const petal = `url(#${uid}-petal)`;
  const leaf = `url(#${uid}-leaf)`;
  const core = `url(#${uid}-core)`;

  if (stage === "bud") {
    return (
      <g>
        <Petals angles={[-55, 55, 180]} cy={1} d={lensPetal(2.6, 6.5)} fill={leaf} />
        <g transform="rotate(-4)">
          <path d={lensPetal(5.4, 12)} fill={petal} />
        </g>
      </g>
    );
  }

  if (stage === "half-open") {
    return (
      <g>
        <Petals angles={[-60, 60, 180]} cy={0.3} d={lensPetal(1.8, 4)} fill={leaf} />
        <PetalRing n={8} startAngle={22.5} cy={-1.5} d={lensPetal(2.2, 7.5)} fill={petal} />
        <circle cx={0} cy={-1.5} r={2.4} fill={core} />
      </g>
    );
  }

  return (
    <g>
      <PetalRing n={8} startAngle={0} cy={-2} d={lensPetal(2.5, 12)} fill={petal} />
      <circle cx={0} cy={-2} r={3.2} fill={core} />
      {[0, 60, 120, 180, 240, 300].map((a) => {
        const rad = (a * Math.PI) / 180;
        return (
          <circle
            key={a}
            cx={Math.sin(rad) * 1.5}
            cy={-2 - Math.cos(rad) * 1.5}
            r={0.35}
            fill="rgba(74,50,30,0.18)"
          />
        );
      })}
    </g>
  );
}

function Tulip({ stage, uid }: BloomHeadProps) {
  const petal = `url(#${uid}-petal)`;
  const leaf = `url(#${uid}-leaf)`;

  if (stage === "bud") {
    return (
      <g>
        <Petals angles={[-65, 65]} cy={2.5} d={lensPetal(1.8, 4.5)} fill={leaf} />
        <g transform="rotate(-3)">
          <path d={roundTipPetal(5.6, 15.5)} fill={petal} />
        </g>
      </g>
    );
  }

  if (stage === "half-open") {
    return <Petals angles={[-16, 16, 0]} cy={0} d={roundTipPetal(4, 11)} fill={petal} />;
  }

  return <Petals angles={[-32, 32, 0]} cy={0} d={roundTipPetal(5, 15)} fill={petal} />;
}

function Poppy({ stage, uid, corePalette }: BloomHeadProps) {
  const petal = `url(#${uid}-petal)`;
  const deep = corePalette.deep;
  const leaf = `url(#${uid}-leaf)`;

  if (stage === "bud") {
    return (
      <g transform="rotate(14)">
        <Petals angles={[-140, 140]} cy={2} d={lensPetal(1.6, 4)} fill={leaf} />
        <path d={roundTipPetal(5.8, 9)} fill={petal} />
      </g>
    );
  }

  if (stage === "half-open") {
    return <Petals angles={[-15, 75, 165, 255]} cy={0} d={roundTipPetal(4.2, 8)} fill={petal} />;
  }

  return (
    <g>
      <Petals angles={[-15, 75, 165, 255]} cy={-1} d={roundTipPetal(6.2, 12.5)} fill={petal} />
      {[-15, 75, 165, 255].map((a) => (
        <line
          key={a}
          transform={`translate(0,-1) rotate(${a})`}
          x1={0}
          y1={-2}
          x2={0}
          y2={-10.5}
          stroke="rgba(74,50,30,0.16)"
          strokeWidth={0.35}
        />
      ))}
      <circle cx={0} cy={-1} r={2.4} fill={deep} />
      {[0, 72, 144, 216, 288].map((a) => {
        const rad = (a * Math.PI) / 180;
        return (
          <line
            key={a}
            x1={Math.sin(rad) * 1}
            y1={-1 - Math.cos(rad) * 1}
            x2={Math.sin(rad) * 2.6}
            y2={-1 - Math.cos(rad) * 2.6}
            stroke="rgba(74,50,30,0.35)"
            strokeWidth={0.35}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}

function Bellflower({ stage, uid, petalPalette }: BloomHeadProps) {
  const petal = `url(#${uid}-petal)`;
  const dark = petalPalette.dark;

  if (stage === "bud") {
    return (
      <g transform="rotate(12)">
        <path d={lensPetal(4.6, 13)} fill={petal} />
      </g>
    );
  }

  if (stage === "half-open") {
    return <PetalRing n={5} startAngle={0} cy={0} d={roundTipPetal(2.8, 7.5)} fill={petal} />;
  }

  return (
    <g>
      <PetalRing n={5} startAngle={0} cy={-1} d={roundTipPetal(3.6, 9)} fill={petal} />
      <circle cx={0} cy={-1} r={1.2} fill={dark} />
    </g>
  );
}

function Rose({ stage, uid, petalPalette, corePalette }: BloomHeadProps) {
  const petal = `url(#${uid}-petal)`;
  const leaf = `url(#${uid}-leaf)`;
  const deep = corePalette.deep;
  const light = petalPalette.light;

  if (stage === "bud") {
    return (
      <g>
        <Petals angles={[-75, 75]} cy={1.5} d={lensPetal(2.1, 5)} fill={leaf} />
        <g transform="rotate(-2)">
          <path d={lensPetal(4.4, 13.5)} fill={petal} />
        </g>
      </g>
    );
  }

  if (stage === "half-open") {
    return (
      <g>
        <Petals angles={[-50, 55, 175]} cy={2} d={roundTipPetal(3.6, 6)} fill={petal} />
        <g transform="rotate(-3)">
          <path d={lensPetal(4.4, 11)} fill={petal} />
        </g>
      </g>
    );
  }

  return (
    <g>
      <PetalRing n={5} startAngle={10} cy={0} d={roundTipPetal(5.5, 10)} fill={petal} />
      <PetalRing n={5} startAngle={46} cy={-1} d={roundTipPetal(3.4, 6.5)} fill={petal} />
      <circle cx={0} cy={-1.6} r={1.6} fill={deep} />
      <path
        d="M-1,-2 C-0.4,-2.8 0.6,-2.8 1,-1.8"
        stroke={light}
        strokeWidth={0.4}
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

function Clover({ stage, uid, leafPalette }: BloomHeadProps) {
  const leaf = `url(#${uid}-leaf)`;
  const petal = `url(#${uid}-petal)`;

  if (stage === "bud") {
    return (
      <g transform="rotate(-6)">
        <path d={lensPetal(4.6, 8.5)} fill={leaf} />
      </g>
    );
  }

  if (stage === "half-open") {
    return (
      <g>
        <Petals angles={[15, 135, 255]} cy={0} d={lensPetal(4.4, 7)} fill={leaf} />
        <line x1={0} y1={0} x2={0} y2={-8} stroke={leafPalette.dark} strokeWidth={1.1} strokeLinecap="round" />
        <ellipse cx={0} cy={-9.5} rx={1.7} ry={2.4} fill={petal} />
      </g>
    );
  }

  return (
    <g>
      <Petals angles={[0, 120, 240]} cy={-1.5} d={lensPetal(6, 9.5)} fill={leaf} />
      <line x1={0} y1={-1.5} x2={0} y2={-12} stroke={leafPalette.dark} strokeWidth={1.2} strokeLinecap="round" />
      {[0, 60, 120, 180, 240, 300].map((a) => {
        const rad = (a * Math.PI) / 180;
        return (
          <circle
            key={a}
            cx={Math.sin(rad) * 2.2}
            cy={-12 - Math.cos(rad) * 2.2}
            r={1.5}
            fill={petal}
          />
        );
      })}
      <circle cx={0} cy={-12} r={1.4} fill={petal} />
    </g>
  );
}

export const BLOOM_HEADS: Record<Species, (props: BloomHeadProps) => ReactElement> = {
  daisy: Daisy,
  tulip: Tulip,
  poppy: Poppy,
  bellflower: Bellflower,
  rose: Rose,
  clover: Clover,
};
