import React from 'react';

import { Toast, ToastWrapper } from './Toast';

/**
 * Props passed to a route's `SuspenseFallback` export.
 */
export type SuspenseFallbackProps = {
  /**
   * The route module's `contextKey`
   *
   * @example
   * `./index.tsx`
   * `./profile/[id].tsx`
   */
  route: string;
  /**
   * The route's URL parameters.
   *
   * @example
   * `{ id: "123" }` // For a route `./profile/[id].tsx` navigated to as `/profile/123`
   */
  params: Record<string, string | string[]>;
};

export function SuspenseFallback({ route }: SuspenseFallbackProps) {
  if (__DEV__) {
    return (
      <ToastWrapper>
        <Toast filename={route}>Bundling...</Toast>
      </ToastWrapper>
    );
  }
  return null;
}
