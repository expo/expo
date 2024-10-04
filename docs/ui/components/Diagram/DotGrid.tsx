import React from 'react';

export function DotGrid() {
  return (
    <div className="z-0 absolute w-full h-full">
      <svg width="100%" height="100%">
        <defs>
          <pattern id="dot-grid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle fill="var(--slate4)" cx="1" cy="1" r="1" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#dot-grid)" />
      </svg>
    </div>
  );
}
