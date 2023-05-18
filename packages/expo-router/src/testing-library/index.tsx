/// <reference types="@types/jest" />
/// <reference types="../../types/jest" />
/// <reference types="../../types/testing-library" />
import './expect';

import { BaseNavigationContainer } from '@react-navigation/core';
import { render, RenderResult } from '@testing-library/react-native';
import { findAll } from '@testing-library/react-native/build/helpers/findAll';
import path from 'path';
import React from 'react';

import { ExpoRoot } from '../ExpoRoot';
import { stateCache } from '../getLinkingConfig';
import { RequireContext } from '../types';
import { initialUrlRef } from './mocks';
import requireContext from './require-context-ponyfill';

// re-export everything
export * from '@testing-library/react-native';

type RenderRouterOptions = Parameters<typeof render>[1] & {
  initialUrl?: string;
};

type RouteOverrideFunction = () => React.ReactElement<any, any> | null;

type RouteOverride = { default: RouteOverrideFunction } | RouteOverrideFunction;

type Result = ReturnType<typeof render> & {
  getPathname(): string;
  getSearchParams(): URLSearchParams;
};

function isOverrideContext(
  context: object
): context is { appDir: string; overrides: Record<string, RouteOverride> } {
  return Boolean(typeof context === 'object' && 'appDir' in context);
}

export function renderRouter(context?: string, options?: RenderRouterOptions): Result;
export function renderRouter(
  context: Record<string, RouteOverride>,
  options?: RenderRouterOptions
): Result;
export function renderRouter(
  context: { appDir: string; overrides: Record<string, RouteOverride> },
  options?: RenderRouterOptions
): Result;
export function renderRouter(
  context:
    | string
    | { appDir: string; overrides: Record<string, RouteOverride> }
    | Record<string, RouteOverride> = './app',
  { initialUrl = '/', ...options }: RenderRouterOptions = {}
): Result {
  jest.useFakeTimers();

  let ctx: RequireContext;

  // Reset the initial URL
  initialUrlRef.value = initialUrl;

  // Force the render to be synchronous
  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';

  if (typeof context === 'string') {
    ctx = requireContext(path.resolve(process.cwd(), context));
  } else if (isOverrideContext(context)) {
    const existingContext = requireContext(path.resolve(process.cwd(), context.appDir));

    ctx = Object.assign(
      function (id: string) {
        if (id in context.overrides) {
          const route = context.overrides[id];
          return typeof route === 'function' ? { default: route } : route;
        } else {
          return existingContext(id);
        }
      },
      {
        keys: () => [...Object.keys(context.overrides), ...existingContext.keys()],
        resolve: (key: string) => key,
        id: '0',
      }
    );
  } else {
    ctx = Object.assign(
      function (id: string) {
        id = id.replace(/^\.\//, '').replace(/\.js$/, '');
        return typeof context[id] === 'function' ? { default: context[id] } : context[id];
      },
      {
        keys: () => Object.keys(context).map((key) => './' + key + '.js'),
        resolve: (key: string) => key,
        id: '0',
      }
    );
  }

  stateCache.clear();

  const result = render(<ExpoRoot context={ctx} location={new URL(initialUrl, 'test://test')} />, {
    ...options,
  });

  return Object.assign(result, {
    getPathname(this: RenderResult & { root: any }): string {
      const containers = findAll(this.root, (node: any) => {
        return node.type === BaseNavigationContainer;
      });

      return (
        '/' +
        containers
          .flatMap((route: any) => {
            return route.props.initialState.routes.map((r: any) => r.name);
          })
          .join('/')
      );
    },
    getSearchParams(this: RenderResult & { root: any }): URLSearchParams {
      const containers = findAll(this.root, (node: any) => {
        return node.type === BaseNavigationContainer;
      });

      const params = containers.reduce<Record<string, string>>(
        (acc: Record<string, unknown>, route: any) => {
          return { ...acc, ...route.props.initialState.routes[0].params };
        },
        {}
      );

      return new URLSearchParams(params);
    },
  });
}
