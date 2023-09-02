// no relative imports
import { getServerManifest } from './getMatchableManifest';
import { getRoutes } from './getRoutes';
import { ctx } from '../_ctx';

export type RouteInfo<TRegex = string> = {
  // dynamic:
  //   | {
  //       name: string;
  //       deep: boolean;
  //     }[]
  //   | null;
  // generated: boolean | undefined;
  // type: string;
  // file: string;
  // regex: TRegex;
  // src: string;

  page: string;
  namedRegex: TRegex;
  routeKeys: { [named: string]: string };
};

export type ExpoRoutesManifestV1<TRegex = string> = {
  // functions: RouteInfo<TRegex>[];
  // staticHtml: RouteInfo<TRegex>[];
  // staticHtmlPaths: string[];

  dynamicRoutes: RouteInfo<TRegex>[];
  staticRoutes: RouteInfo<TRegex>[];
  notFoundRoutes: RouteInfo<TRegex>[];
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
