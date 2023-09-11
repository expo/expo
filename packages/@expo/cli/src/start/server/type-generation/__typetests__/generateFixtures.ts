import { writeFile } from 'fs/promises';
import { join } from 'path';

import { getTemplateString } from '../routes';

type Fixture = {
  staticRoutes: string[];
  dynamicRoutes: string[];
  dynamicRouteTemplates: string[];
};

const fixtures: Record<string, Fixture> = {
  basic: {
    staticRoutes: ['/apple', '/banana'],
    dynamicRoutes: [
      '/colors/${SingleRoutePart<T>}',
      '/animals/${CatchAllRoutePart<T>}',
      '/mix/${SingleRoutePart<T>}/${SingleRoutePart<T>}/${CatchAllRoutePart<T>}',
    ],
    dynamicRouteTemplates: [
      '/colors/[color]',
      '/animals/[...animal]',
      '/mix/[fruit]/[color]/[...animals]',
    ],
  },
};

export default async function () {
  await Promise.all(
    Object.entries(fixtures).map(async ([key, value]) => {
      const template = getTemplateString(
        new Set(value.staticRoutes),
        new Set(value.dynamicRoutes),
        new Set(value.dynamicRouteTemplates)
      )
        // The Template produces a global module .d.ts declaration
        // These replacements turn it into a local module
        .replaceAll(/^  /gm, '')
        .replace(/declare module "expo-router" {/, '')
        .replaceAll(/export function/g, 'export declare function')
        .replaceAll(/export const/g, 'export declare const')
        // Remove the last `}`
        .slice(0, -2);

      return writeFile(join(__dirname, './fixtures/', key + '.ts'), template);
    })
  );

  console.log('done');
}
