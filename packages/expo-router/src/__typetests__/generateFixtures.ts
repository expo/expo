import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

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
  const template = await readFile(join(__dirname, '../../types/expo-router.d.ts'), 'utf8');
  await Promise.all(
    Object.entries(fixtures).map(async ([key, value]) => {
      const types = template
        // Swap from being a namespace to a module
        .replace('declare namespace ExpoRouter {', '')
        // Add the route values
        .replace(
          'type StaticRoutes = string;',
          `type StaticRoutes = ${setToUnionType(value.staticRoutes)};`
        )
        .replace(
          'type DynamicRoutes<T extends string> = string;',
          `type DynamicRoutes<T extends string> = ${setToUnionType(value.dynamicRoutes)};`
        )
        .replace(
          'type DynamicRouteTemplate = never;',
          `type DynamicRouteTemplate = ${setToUnionType(value.dynamicRouteTemplates)};`
        )
        .replace(/\}\s+$/, '')
        .replaceAll(/export const/g, 'export declare const')
        .replaceAll(/export function/g, 'export declare function');

      return writeFile(join(__dirname, './fixtures/', key + '.ts'), types);
    })
  );

  console.log('done');
}

export const setToUnionType = (set: string[]) => {
  return set.length > 0 ? [...set].map((s) => `\`${s}\``).join(' | ') : 'never';
};
