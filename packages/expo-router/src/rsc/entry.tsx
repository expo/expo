/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

import React from 'react';

import { Router } from './router/client';
import { RootWrap } from './router/root-wrap';

// Must be exported or Fast Refresh won't update the context
export function App() {
  return (
    <RootWrap>
      <Router />
    </RootWrap>
  );
}
