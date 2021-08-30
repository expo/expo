import { theme } from '@expo/styleguide';
import React from 'react';

export function Search() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
      <path
        d="M13.829 8.326a5.503 5.503 0 11-11.005 0 5.503 5.503 0 0111.005 0z"
        stroke={theme.icon.default}
        strokeWidth="1.495"
      />
      <path
        d="M12.458 12.458l4.167 4.167"
        stroke={theme.icon.default}
        strokeWidth="1.495"
        strokeLinecap="round"
      />
    </svg>
  );
}
