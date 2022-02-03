import { theme } from '@expo/styleguide';
import * as React from 'react';

export const CheckCircle: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg
    aria-label="check"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill={theme.status.success} />
    <path
      d="M18 7.5l-8.25 8.25L6 12"
      stroke={theme.background.default}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
