"use client";
import { JigsawPieceImage } from "./JigsawPieceImage";

export function TripMapJigsaw({ state }: { state: boolean[] }) {
  return (
    <div className="mx-auto max-w-md sm:max-w-2xl md:max-w-4xl px-4">
      <div className="rounded-2xl border-[3px] border-ink bg-white p-2 sm:p-3 shadow-[5px_5px_0_var(--color-ink)]">
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-9 sm:gap-2">
          {state.map((placed, i) => (
            <div
              key={i}
              className="aspect-square relative rounded-md bg-[color-mix(in_srgb,var(--color-paper)_80%,var(--color-ink)_5%)] border-[2px] border-dashed border-ink/40 flex items-center justify-center overflow-hidden"
            >
              {placed ? (
                <JigsawPieceImage
                  n={i + 1}
                  className="w-full h-full object-contain animate-piece-drop"
                />
              ) : (
                <span className="text-ink/20 text-xs font-display">{i + 1}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
