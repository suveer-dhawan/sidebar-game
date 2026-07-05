import { useId } from "react";
import type { CSSProperties } from "react";
import { CAT_BELLY, CAT_EAR_INNER, CAT_FEATURE, CAT_PALETTE } from "./colour";

export type CatMood = "napping" | "alert" | "curled";

export interface CatProps {
  mood: CatMood;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

// The resident cat is a reactive presence, not a mascot: she never speaks,
// never praises, never appears with a tip. She naps by default, and only
// perks up briefly on her own when a bloom takes root nearby - the same way
// a real cat's ear turns toward a sound. `mood` is fully owned by the
// caller so that reaction stays tied to what's actually happening in the
// garden, never to a scripted beat.
export function Cat({ mood, size = 56, className, style }: CatProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  return (
    <div
      key={mood}
      className={`animate-cat-perk pointer-events-none ${className ?? ""}`}
      style={style}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 70" width={size} height={(size * 70) / 100}>
        <defs>
          <linearGradient id={`${uid}-cat-body`} x1="0" y1="1" x2="0.3" y2="0">
            <stop offset="0%" stopColor={CAT_PALETTE.dark} />
            <stop offset="60%" stopColor={CAT_PALETTE.base} />
            <stop offset="100%" stopColor={CAT_PALETTE.light} />
          </linearGradient>
        </defs>

        <ellipse cx={50} cy={65} rx={30} ry={4.5} fill={CAT_FEATURE} opacity={0.16} />

        <g className="animate-cat-breathe" style={{ transformOrigin: "50px 60px" }}>
          {mood === "napping" && <NappingCat uid={uid} />}
          {mood === "alert" && <AlertCat uid={uid} />}
          {mood === "curled" && <CurledCat uid={uid} />}
        </g>
      </svg>
    </div>
  );
}

function NappingCat({ uid }: { uid: string }) {
  return (
    <g>
      <path
        className="animate-cat-tail"
        style={{ transformOrigin: "22px 48px" }}
        d="M22,48 C8,48 3,34 11,23 C15,17 23,15 29,19"
        stroke={CAT_PALETTE.dark}
        strokeWidth={6.5}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M18,58 C14,44 20,29 36,25 C45,22.5 51,22.5 58,25 C74,29 84,41 84,53 C84,62 75,66 63,66 C49,68 31,68 21,66 C17,65 17,61 18,58 Z"
        fill={`url(#${uid}-cat-body)`}
      />
      <ellipse cx={62} cy={44} rx={9} ry={7} fill={CAT_BELLY} opacity={0.5} />
      <path
        className="animate-cat-ear-twitch"
        style={{ transformOrigin: "63px 22px" }}
        d="M57,21 L61,8 L68,20 Z"
        fill={CAT_PALETTE.dark}
      />
      <path d="M60,18 L62.5,11 L66,17.5 Z" fill={CAT_EAR_INNER} opacity={0.85} />
      <path d="M70,19 L76,7 L80,21 Z" fill={CAT_PALETTE.dark} />
      <path d="M72.5,18 L76,10.5 L78.5,18.5 Z" fill={CAT_EAR_INNER} opacity={0.85} />
      <path
        d="M62,31 q4,-3 8,0 M74,30 q4,-3 8,0"
        stroke={CAT_FEATURE}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M72,35.5 L76,35.5 L74,38 Z" fill={CAT_FEATURE} opacity={0.8} />
      <path
        d="M55,34 L47,33.5 M55,36.5 L46,37 M92,34 L84,34.5 M92,37 L83,37.5"
        stroke={CAT_FEATURE}
        strokeWidth={0.8}
        opacity={0.35}
        strokeLinecap="round"
      />
    </g>
  );
}

function AlertCat({ uid }: { uid: string }) {
  return (
    <g>
      <path
        className="animate-cat-tail"
        style={{ transformOrigin: "78px 58px" }}
        d="M78,58 C93,57 97,45 89,35 C85,30 79,29 75,33"
        stroke={CAT_PALETTE.dark}
        strokeWidth={6.5}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M30,66 C21,66 17,57 17,47 C17,32 28,21 50,21 C72,21 83,32 83,47 C83,57 79,66 70,66 Z"
        fill={`url(#${uid}-cat-body)`}
      />
      <ellipse cx={50} cy={52} rx={11} ry={12} fill={CAT_BELLY} opacity={0.5} />
      <path
        className="animate-cat-ear-twitch"
        style={{ transformOrigin: "38px 12px" }}
        d="M34,13 L31,0 L44,10 Z"
        fill={CAT_PALETTE.dark}
      />
      <path d="M35.5,10 L33.5,2.5 L41,8.5 Z" fill={CAT_EAR_INNER} opacity={0.85} />
      <path d="M62,10 L66,-1 L69,12 Z" fill={CAT_PALETTE.dark} />
      <path d="M63.5,8.5 L66,1.5 L67.7,9.5 Z" fill={CAT_EAR_INNER} opacity={0.85} />

      <g className="animate-cat-blink" style={{ transformOrigin: "42px 26px" }}>
        <path d="M38,26 q4,-3 8,0" stroke={CAT_FEATURE} strokeWidth={2} fill="none" strokeLinecap="round" />
      </g>
      <g className="animate-cat-blink" style={{ transformOrigin: "58px 26px" }}>
        <path d="M54,26 q4,-3 8,0" stroke={CAT_FEATURE} strokeWidth={2} fill="none" strokeLinecap="round" />
      </g>
      <ellipse cx={42} cy={25} rx={2.6} ry={3.4} fill={CAT_FEATURE} />
      <ellipse cx={58} cy={25} rx={2.6} ry={3.4} fill={CAT_FEATURE} />
      <circle cx={42.9} cy={23.7} r={0.8} fill="#FFF8F2" opacity={0.85} />
      <circle cx={58.9} cy={23.7} r={0.8} fill="#FFF8F2" opacity={0.85} />
      <path d="M48,31 L52,31 L50,33.5 Z" fill={CAT_FEATURE} opacity={0.8} />
      <path
        d="M46,33 q4,3 8,0"
        stroke={CAT_FEATURE}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
        opacity={0.6}
      />
      <path
        d="M35,30 L25,28.5 M35,32.5 L24,33 M65,30 L75,28.5 M65,32.5 L76,33"
        stroke={CAT_FEATURE}
        strokeWidth={0.8}
        opacity={0.35}
        strokeLinecap="round"
      />
    </g>
  );
}

function CurledCat({ uid }: { uid: string }) {
  return (
    <g>
      <path
        className="animate-cat-tail"
        style={{ transformOrigin: "26px 52px" }}
        d="M26,52 C14,50 12,36 22,29"
        stroke={CAT_PALETTE.dark}
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
        opacity={0.75}
      />
      <ellipse cx={50} cy={46} rx={27} ry={19} fill={`url(#${uid}-cat-body)`} />
      <path d="M35,29 L33,18 L44,27 Z" fill={CAT_PALETTE.dark} />
      <path d="M65,29 L67,18 L56,27 Z" fill={CAT_PALETTE.dark} />
      <ellipse cx={50} cy={42} rx={9} ry={6} fill={CAT_BELLY} opacity={0.4} />
      <path
        d="M42,49 q4,-3 8,0 M52,49 q4,-3 8,0"
        stroke={CAT_FEATURE}
        strokeWidth={1.7}
        fill="none"
        strokeLinecap="round"
        opacity={0.85}
      />
      <path d="M49,54 L53,54 L51,56.5 Z" fill={CAT_FEATURE} opacity={0.75} />
    </g>
  );
}
