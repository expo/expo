/// <reference types="../../types/jest" />
import './expect';

import { render, screen as rnScreen } from '@testing-library/react-native';
import path from 'path';
import React from 'react';

import {
  FileStub,
  inMemoryContext,
  requireContext,
  requireContextWithOverrides,
} from './context-stubs';
import { setInitialUrl } from './mocks';
import { ExpoRoot } from '../ExpoRoot';
import { stateCache } from '../getLinkingConfig';
import { store } from '../global-state/router-store';
import { RequireContext } from '../types';

// re-export everything
export * from '@testing-library/react-native';
export let screen = rnScreen as RenderResult;

type RenderRouterOptions = Parameters<typeof render>[1] & {
  initialUrl?: any;
};

type RenderResult = ReturnType<typeof render> & {
  getPathname(): string;
  getSegments(): string[];
  getSearchParams(): Record<string, string | string[]>;
  getRootState(): Record<string, unknown>;
};

function isOverrideContext(
  context: object
): context is { appDir: string; overrides: Record<string, FileStub> } {
  return Boolean(typeof context === 'object' && 'appDir' in context);
}

export function renderRouter(context?: string, options?: RenderRouterOptions): RenderResult;
export function renderRouter(
  context: Record<string, FileStub>,
  options?: RenderRouterOptions
): RenderResult;
export function renderRouter(
  context: { appDir: string; overrides: Record<string, FileStub> },
  options?: RenderRouterOptions
): RenderResult;
export function renderRouter(
  context:
    | string
    | { appDir: string; overrides: Record<string, FileStub> }
    | Record<string, FileStub> = './app',
  { initialUrl = '/', ...options }: RenderRouterOptions = {}
): RenderResult {
  jest.useFakeTimers();

  let ctx: RequireContext;

  // Reset the initial URL

  setInitialUrl(initialUrl);

  // Force the render to be synchronous
  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';

  if (typeof context === 'string') {
    ctx = requireContext(path.resolve(process.cwd(), context));
  } else if (isOverrideContext(context)) {
    ctx = requireContextWithOverrides(context.appDir, context.overrides);
  } else {
    ctx = inMemoryContext(context);
  }

  stateCache.clear();

  let location: URL | undefined;

  if (typeof initialUrl === 'string') {
    location = new URL(initialUrl, 'test://');
  } else if (initialUrl instanceof URL) {
    location = initialUrl;
  }

  const result = render(<ExpoRoot context={ctx} location={location} />, {
    ...options,
  });

  screen = Object.assign(result, {
    getRootState() {
      return store.rootStateSnapshot();
    },
    getPathname(this: RenderResult): string {
      return store.routeInfoSnapshot().pathname;
    },
    getSegments(this: RenderResult): string[] {
      return store.routeInfoSnapshot().segments;
    },
    getSearchParams(this: RenderResult): Record<string, string | string[]> {
      return store.routeInfoSnapshot().params;
    },
  });

  return screen;
}
