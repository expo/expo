/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import '@expo/metro-runtime';

import * as Font from 'expo-font/build/server';
import { ExpoRoot } from 'expo-router';
import { ctx } from 'expo-router/_ctx';
import Head from 'expo-router/head';
import {
  ServerDocument,
  type ServerDocumentComponent,
  type ServerDocumentPayload,
} from 'expo-router/internal/server';
import { InnerRoot, registerStaticRootComponent } from 'expo-router/internal/static';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { getRootComponent } from './getRootComponent';
import { createDebug } from '../utils/debug';
import {
  createFontResourceNodes,
  createInjectedCssNodes,
  createLoaderDataScriptContents,
  getHydrationFlagScriptContents,
} from '../utils/html';

const debug = createDebug('expo:router:server:renderStreamingContent');

export type GetStreamingContentOptions = {
  loader?: {
    data?: any;
    key: string;
  };
  metadata?: {
    headNodes: React.ReactNode[];
  } | null;
  request?: Request;
  assets?: {
    css: string[];
    js: string[];
  };
};

function resetReactNavigationContexts() {
  // TODO(@hassankhan): Share this request-scoped setup with renderStaticContent.tsx.
  const contexts = '__react_navigation__elements_contexts';
  (globalThis as any)[contexts] = new Map<string, React.Context<any>>();
}

function createStreamingBodyNodes(getStyleElement: () => React.ReactNode): React.ReactNode[] {
  const descriptors = Font.getServerResourceDescriptors();
  debug(`Pushing static fonts: (count: ${descriptors.length})`, descriptors);
  return [getStyleElement(), ...createFontResourceNodes(descriptors)];
}

function createServerDocumentPayload(
  getStyleElement: () => React.ReactNode,
  options?: GetStreamingContentOptions
): ServerDocumentPayload {
  return {
    bodyNodes: createStreamingBodyNodes(getStyleElement),
    headNodes: [
      ...(options?.metadata?.headNodes ?? []),
      ...createInjectedCssNodes(options?.assets?.css ?? []),
    ],
  };
}

function createStreamingBootstrapScriptContent(loadedData: Record<string, unknown> | null): string {
  const parts = [getHydrationFlagScriptContents()];
  if (loadedData) {
    parts.push(createLoaderDataScriptContents(loadedData));
  }
  return parts.join('');
}

export async function getStreamingContent(
  location: URL,
  options?: GetStreamingContentOptions
): Promise<ReadableStream<Uint8Array>> {
  Font.resetServerContext();
  resetReactNavigationContexts();

  const Root = getRootComponent() as ServerDocumentComponent;
  // TODO(@hassankhan): Share loader-data shaping with renderStaticContent.tsx.
  const loaderKey = options?.loader ? options.loader.key + location.search : null;
  const loadedData = loaderKey
    ? {
        [loaderKey]: options?.loader?.data ?? null,
      }
    : null;

  const { element, getStyleElement } = registerStaticRootComponent(ExpoRoot, {
    location,
    context: ctx,
    wrapper: ({ children }: React.PropsWithChildren) => (
      <ServerDocument Root={Root} payload={createServerDocumentPayload(getStyleElement, options)}>
        <div id="root">{children}</div>
      </ServerDocument>
    ),
  });

  // We're leaving <Head.Provider> in for now to prevent errors if users do use <Head> in their app;
  // we now log a warning to the console in development
  return ReactDOMServer.renderToReadableStream(
    <Head.Provider>
      <InnerRoot loadedData={loadedData}>{element}</InnerRoot>
    </Head.Provider>,
    {
      bootstrapScriptContent: createStreamingBootstrapScriptContent(loadedData),
      bootstrapScripts: options?.assets?.js,
      signal: options?.request?.signal,
    }
  );
}

export { resolveMetadata } from '../utils/metadata/resolve';
