/// <reference types="./index" />

import '@expo/metro-runtime';

import React from 'react';

import { ctx } from './_ctx';
import { ExpoRoot, ExpoRootProps } from './build/ExpoRoot';
import { getNavigationConfig } from './build/getLinkingConfig';
import { getRoutes } from './build/getRoutes';
import { loadStaticParamsAsync } from './build/loadStaticParamsAsync';

// Must be exported or Fast Refresh won't update the context >:[
export default function ExpoRouterRoot(props: Omit<ExpoRootProps, 'context'>) {
  return <ExpoRoot context={ctx} {...props} />;
}

/** Get the linking manifest from a Node.js process. */
export async function getManifest(options: any) {
  const routeTree = getRoutes(ctx, options);

  if (!routeTree) {
    throw new Error('No routes found');
  }

  // Evaluate all static params
  await loadStaticParamsAsync(routeTree);

  return getNavigationConfig(routeTree);
}

export { ctx };
