"use client";
import { useState } from "react";

export function JigsawPieceImage({ n, className }: { n: number; className?: string }) {
  // Try PNG first (user-generated), fall back to SVG (placeholder), both via <img> so onError is catchable.
  const [src, setSrc] = useState(`/jigsaw/pieces/piece-${n}.png`);
  return (
    <img
      src={src}
      alt={`Trip day ${n}`}
      className={className}
      onError={() => {
        if (src.endsWith(".png")) setSrc(`/jigsaw/pieces/piece-${n}.svg`);
      }}
    />
  );
}
