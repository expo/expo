import { theme } from '@expo/styleguide';
import * as React from 'react';

export const XCircle: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg
    aria-label="x"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill={theme.status.error} />
    <path
      d="M16.5 7.5l-9 9M7.5 7.5l9 9"
      stroke={theme.background.default}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
