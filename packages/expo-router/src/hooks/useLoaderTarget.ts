'use client';

import { use, useMemo } from 'react';

import { useContextKey } from '../Route';
import { LoaderContext } from '../loaders/LoaderContext';
import { ROOT_LOADER_OWNER, type LoaderOwner, type LoaderRuntime } from '../loaders/LoaderRuntime';
import {
  ServerDataLoaderContext,
  type ServerDataLoaderData,
} from '../loaders/ServerDataLoaderContext';
import { resolveLoaderPath } from '../loaders/resolveLoaderPath';
import { NavigationRouteContext } from '../react-navigation/core/NavigationProvider';
import { useCurrentRouteInfo } from './useCurrentRouteInfo';

export function useLoaderTarget(): {
  runtime: LoaderRuntime;
  serverData: ServerDataLoaderData;
  owner: LoaderOwner;
  path: string;
} {
  const runtime = use(LoaderContext);
  const serverData = use(ServerDataLoaderContext);
  const owner = use(NavigationRouteContext)?.key ?? ROOT_LOADER_OWNER;
  const routeInfo = useCurrentRouteInfo();
  const contextKey = useContextKey();
  const path = useMemo(() => resolveLoaderPath(contextKey, routeInfo), [contextKey, routeInfo]);
  return { runtime, serverData, owner, path };
}
