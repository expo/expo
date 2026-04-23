import { ctx } from 'expo-router/_ctx';
import type { GenerateMetadataFunction, ImmutableRequest, Metadata } from 'expo-server';

import { serializeMetadataToHtml } from '../utils/metadata/serialize';

type RouteModuleExports = {
  generateMetadata?: GenerateMetadataFunction;
};

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
  headTags: string;
};

function getGenerateMetadata(moduleExports: RouteModuleExports): GenerateMetadataFunction | null {
  return typeof moduleExports.generateMetadata === 'function'
    ? moduleExports.generateMetadata
    : null;
}

export async function resolveMetadata(
  options: ResolveMetadataOptions
): Promise<ResolvedMetadata | null> {
  const routeModule = (await ctx(options.route.file)) as RouteModuleExports | undefined;
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
    headTags: serializeMetadataToHtml(metadata),
  };
}
