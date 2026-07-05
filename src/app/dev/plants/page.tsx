import { Fraunces } from "next/font/google";
import { BackButton } from "@/components/layout/BackButton";
import { Plant } from "@/components/garden/Plant";
import {
  COLOURS,
  COLOUR_LABEL,
  COUNTS,
  GROWTH_LABEL,
  GROWTH_STAGES,
  SPECIES,
  SPECIES_LABEL,
} from "@/lib/pattern-engine";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export default function PlantsDevGalleryPage() {
  return (
    <div className={`${fraunces.variable} flex flex-1 flex-col gap-10 p-8`}>
      <BackButton />

      <div className="flex flex-col gap-2">
        <h1
          className="text-3xl text-text"
          style={{ fontFamily: "var(--font-fraunces), serif", fontWeight: 600 }}
        >
          Garden plot gallery
        </h1>
        <p className="max-w-2xl text-sm text-text-light">
          Full visual matrix for the <code className="text-text">Plant</code> component: every
          species, every colour, every growth stage, at count 1/2/3. Dev-only reference — not the
          game screen.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2
          className="text-lg text-text"
          style={{ fontFamily: "var(--font-fraunces), serif", fontWeight: 600 }}
        >
          Empty plot
        </h2>
        <div className="flex flex-wrap items-end gap-6 rounded-card bg-surface p-6">
          <Plant size={72} />
          <Plant size={88} />
          <Plant size={96} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2
          className="text-lg text-text"
          style={{ fontFamily: "var(--font-fraunces), serif", fontWeight: 600 }}
        >
          Species at a glance (large, full bloom, count 1)
        </h2>
        <div className="flex flex-wrap gap-6 rounded-card bg-surface p-6">
          {SPECIES.map((species) => (
            <div key={species} className="flex flex-col items-center gap-2">
              <Plant species={species} colour="coral" count={1} growthStage="full-bloom" size={220} />
              <span className="text-xs capitalize text-text-light">{SPECIES_LABEL[species]}</span>
            </div>
          ))}
        </div>
      </section>

      {SPECIES.map((species) => (
        <section key={species} className="flex flex-col gap-3">
          <h2
            className="text-lg capitalize text-text"
            style={{ fontFamily: "var(--font-fraunces), serif", fontWeight: 600 }}
          >
            {SPECIES_LABEL[species]}
          </h2>

          <div className="overflow-x-auto rounded-card bg-surface p-4">
            <table className="border-separate border-spacing-3">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-text-light">
                    growth ↓ / colour →
                  </th>
                  {COLOURS.map((colour) => (
                    <th
                      key={colour}
                      className="text-center text-xs font-medium capitalize text-text-light"
                    >
                      {COLOUR_LABEL[colour]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GROWTH_STAGES.map((stage) => (
                  <tr key={stage}>
                    <td className="whitespace-nowrap text-xs font-medium capitalize text-text-light">
                      {GROWTH_LABEL[stage]}
                    </td>
                    {COLOURS.map((colour) => (
                      <td key={colour} className="align-bottom">
                        <div className="flex items-end gap-1 rounded-button bg-bg p-1">
                          {COUNTS.map((count) => (
                            <Plant
                              key={count}
                              species={species}
                              colour={colour}
                              count={count}
                              growthStage={stage}
                              size={72}
                            />
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
