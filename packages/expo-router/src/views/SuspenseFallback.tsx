import React from 'react';

import { Toast, ToastWrapper } from './Toast';
import { RouteNode } from '../Route';

/**
 * Props passed to a route's `SuspenseFallback` export.
 *
 * @privateRemarks This type intentionally differs from the `<SuspenseFallback>` component's props
 * below since the `RouteNode` type isn't generally meant for public consumption.
 */
export type SuspenseFallbackProps = {
  /**
   * The route module's `contextKey`
   *
   * @example `./index.tsx`
   * @example `./profile/[id].tsx`
   */
  route: string;
};

export function SuspenseFallback({ route }: { route: RouteNode }) {
  if (__DEV__) {
    return (
      <ToastWrapper>
        <Toast filename={route?.contextKey}>Bundling...</Toast>
      </ToastWrapper>
    );
  }
  return null;
}
