import { theme } from '@expo/styleguide';
import React from 'react';

export function MoreHorizontal() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
      <path
        d="M10 10.833a.833.833 0 100-1.666.833.833 0 000 1.666zM15.833 10.833a.833.833 0 100-1.666.833.833 0 000 1.666zM4.167 10.833a.833.833 0 100-1.666.833.833 0 000 1.666z"
        fill={theme.icon.default}
        stroke={theme.icon.default}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
