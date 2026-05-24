import { ctx } from 'expo-router/_ctx';
import type { LoadedRoute } from 'expo-router/build/Route';
import type { GenerateMetadataFunction, ImmutableRequest, Metadata } from 'expo-server';
import type { ReactNode } from 'react';

import { serializeMetadataToReact } from '../utils/metadata/serialize';

type ResolveMetadataOptions = {
  route: {
    file: string;
    page: string;
  };
  request: ImmutableRequest;
  params: Record<string, string | string[]>;
};

type ResolvedMetadata = {
  metadata: Metadata;
  headNodes: ReactNode[];
};

function getGenerateMetadata(moduleExports: LoadedRoute): GenerateMetadataFunction | null {
  return typeof moduleExports.generateMetadata === 'function'
    ? moduleExports.generateMetadata
    : null;
}

export async function resolveMetadata(
  options: ResolveMetadataOptions
): Promise<ResolvedMetadata | null> {
  const routeModule = (await ctx(options.route.file)) as LoadedRoute | undefined;
  if (!routeModule) {
    return null;
  }

  const generateMetadata = getGenerateMetadata(routeModule);
  if (!generateMetadata) {
    return null;
  }

  const metadata = await generateMetadata(options.request, options.params);

  if (metadata == null) {
    return null;
  }

  return {
    metadata,
    headNodes: serializeMetadataToReact(metadata),
  };
}
