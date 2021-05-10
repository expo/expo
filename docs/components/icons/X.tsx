import { theme } from '@expo/styleguide';
import React from 'react';

export function X() {
  return (
    <svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M15 5L5 15M5 5l10 10"
        stroke={theme.icon.default}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
