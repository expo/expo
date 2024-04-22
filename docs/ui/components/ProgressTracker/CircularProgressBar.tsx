import React from 'react';

type CircularProgressBarProps = {
  progress: number;
};

export function CircularProgressBar({ progress }: CircularProgressBarProps) {
  // Updated to match a diameter of 12, radius of 6 for the outer circle
  const strokeWidth = 2; // The thickness of the progress bar
  const size = 14; // The size of the SVG container in pixels
  const radius = (size - strokeWidth) / 2; // The radius of the circle, accounting for the stroke width
  const circumference = Math.PI * 2 * radius; // The circumference of the circle
  const strokeDashoffset = circumference - (progress / 100) * circumference; // The offset for the stroke dash, creating the progress effect

  return (
    <div className="flex items-center justify-center mr-1">
      <svg width={size} height={size}>
        {/* The background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#eee"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
        />
        {/* The progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#0081F1" // The color for the progress portion of the circle
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
