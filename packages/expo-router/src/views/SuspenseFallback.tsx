import React from 'react';

import { Toast, ToastWrapper } from './Toast';
import { RouteNode } from '../Route';

export function SuspenseFallback({ route }: { route: RouteNode }) {
  if (__DEV__) {
    return (
      <ToastWrapper>
        <Toast filename={route?.contextKey}>Bundling...</Toast>
      </ToastWrapper>
    );
  }
  // TODO: Support user's customizing the fallback.
  return null;
}
