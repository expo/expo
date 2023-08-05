// no relative imports
import { ctx } from '../_ctx';
import { getServerManifest } from './getMatchableManifest';
import { getRoutes } from './getRoutes';

export type RouteInfo<TRegex = string> = {
  dynamic:
    | {
        name: string;
        deep: boolean;
      }[]
    | null;
  generated: boolean | undefined;
  type: string;
  file: string;
  regex: TRegex;
  src: string;
};

export type ExpoRoutesManifestV1<TRegex = string> = {
  functions: RouteInfo<TRegex>[];
  staticHtml: RouteInfo<TRegex>[];
  staticHtmlPaths: string[];
};

export async function createRoutesManifest(): Promise<any> {
  const routeTree = getRoutes(ctx, {
    preserveApiRoutes: true,
    ignoreRequireErrors: true,
  });

  if (!routeTree) {
    return null;
  }
  return getServerManifest(routeTree);
}
