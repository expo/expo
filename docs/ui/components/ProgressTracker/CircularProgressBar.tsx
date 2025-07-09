import React from 'react';

type CircularProgressBarProps = {
  progress: number;
};

export function CircularProgressBar({ progress }: CircularProgressBarProps) {
  const strokeWidth = 2;
  const size = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * 2 * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="mr-1 flex items-center justify-center">
      <svg width={size} height={size}>
        {/* The background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          className="stroke-bg-element"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          className="stroke-palette-blue9"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
    </div>
  );
}
