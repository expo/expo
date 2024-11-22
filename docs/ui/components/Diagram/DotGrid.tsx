import React from 'react';

export function DotGrid() {
  return (
    <div className="absolute z-0 size-full">
      <svg width="100%" height="100%">
        <defs>
          <pattern id="dot-grid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle fill="var(--slate-4)" cx="1" cy="1" r="1" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#dot-grid)" />
      </svg>
    </div>
  );
}
