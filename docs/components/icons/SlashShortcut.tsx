import { theme } from '@expo/styleguide';
import React from 'react';

export function SlashShortcut() {
  return (
    <svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x=".5" y=".5" width="19" height="19" rx="3.5" stroke={theme.icon.default} />
      <path d="M6.5 16l7-12" stroke={theme.icon.default} />
    </svg>
  );
}
