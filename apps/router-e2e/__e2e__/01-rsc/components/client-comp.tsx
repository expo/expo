'use client';

import React from 'react';
import { renderChildren } from './server-func';

export function MyComp() {
  return (
    <>
      <p>Client</p>
      <React.Suspense fallback={<p>Loading...</p>}>{renderChildren()}</React.Suspense>
    </>
  );
}
