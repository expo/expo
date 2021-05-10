import { theme } from '@expo/styleguide';
import * as React from 'react';

export const PendingCircle: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg
    aria-label="pending"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill={theme.status.info} />
    <path
      d="M11.973 7.487v4.486l2.991 1.495m4.487-1.495a7.478 7.478 0 11-14.956 0 7.478 7.478 0 0114.956 0z"
      stroke="#fff"
      strokeWidth="1.496"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
