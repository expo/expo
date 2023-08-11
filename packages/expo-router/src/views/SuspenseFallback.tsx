import React from 'react';

import { Toast, ToastWrapper } from './Toast';
import { RouteNode } from '../Route';

export function SuspenseFallback({ route }: { route: RouteNode }) {
  return (
    <ToastWrapper>
      <Toast filename={route?.contextKey}>Bundling...</Toast>
    </ToastWrapper>
  );
}
