import { palette } from '@expo/styleguide';
import * as React from 'react';

export const ExternalLink: React.FC<{ size?: number; stroke?: string }> = ({
  size = 24,
  stroke = palette.dark.white,
}) => (
  <svg
    aria-label="check"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <path
      d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6m4-3h6v6m-11 5L21 3"
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
