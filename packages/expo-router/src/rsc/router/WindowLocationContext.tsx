/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// Emulates the window.location object on native.
import * as React from 'react';

export function LocationContext({ children }: { children: React.ReactElement }) {
  return <>{children}</>;
}

export function useVirtualLocation() {
  return null;
}
