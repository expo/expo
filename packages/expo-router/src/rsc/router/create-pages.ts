/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * https://github.com/dai-shi/waku/blob/3d1cc7d714b67b142c847e879c30f0724fc457a7/packages/waku/src/router/create-pages.ts#L1
 */

import { createElement } from 'react';
import type { FunctionComponent, ReactNode } from 'react';

import type { RouteProps } from './common.js';
import { unstable_defineRouter } from './defineRouter';
import { joinPath, parsePathWithSlug, getPathMapping, path2regexp } from '../path';
import type { PathSpec } from '../path';
import type { BuildConfig } from '../server.js';

const hasPathSpecPrefix = (prefix: PathSpec, path: PathSpec) => {
  for (let i = 0; i < prefix.length; i++) {
    if (
      i >= path.length ||
      prefix[i]!.type !== path[i]!.type ||
      prefix[i]!.name !== path[i]!.name
    ) {
      return false;
    }
  }
  return true;
};

const sanitizeSlug = (slug: string) => slug.replace(/\./g, '').replace(/ /g, '-');

// createPages API (a wrapper around unstable_defineRouter)

/**
 * Type version of `String.prototype.split()`. Splits the first string argument by the second string argument
 * @example
 * ```ts
 * // ['a', 'b', 'c']
 * type Case1 = Split<'abc', ''>
 * // ['a', 'b', 'c']
 * type Case2 = Split<'a,b,c', ','>
 * ```
 */
type Split<Str extends string, Del extends string | number> = string extends Str
  ? string[]
  : '' extends Str
    ? []
    : Str extends `${infer T}${Del}${infer U}`
      ? [T, ...Split<U, Del>]
      : [Str];

/** Assumes that the path is a part of a slug path. */
type IsValidPathItem<T> = T extends `/${infer _}` ? false : T extends '[]' | '' ? false : true;
/**
 * This is a helper type to check if a path is valid in a slug path.
 */
export type IsValidPathInSlugPath<T> = T extends `/${infer L}/${infer R}`
  ? IsValidPathItem<L> extends true
    ? IsValidPathInSlugPath<`/${R}`>
    : false
  : T extends `/${infer U}`
    ? IsValidPathItem<U>
    : false;
/** Checks if a particular slug name exists in a path. */
export type HasSlugInPath<T, K extends string> = T extends `/[${K}]/${infer _}`
  ? true
  : T extends `/${infer _}/${infer U}`
    ? HasSlugInPath<`/${U}`, K>
    : T extends `/[${K}]`
      ? true
      : false;

export type HasWildcardInPath<T> = T extends `/[...${string}]/${string}`
  ? true
  : T extends `/${infer _}/${infer U}`
    ? HasWildcardInPath<`/${U}`>
    : T extends `/[...${string}]`
      ? true
      : false;

export type PathWithSlug<T, K extends string> =
  IsValidPathInSlugPath<T> extends true ? (HasSlugInPath<T, K> extends true ? T : never) : never;

type _GetSlugs<
  Route extends string,
  SplitRoute extends string[] = Split<Route, '/'>,
  Result extends string[] = [],
> = SplitRoute extends []
  ? Result
  : SplitRoute extends [`${infer MaybeSlug}`, ...infer Rest]
    ? Rest extends string[]
      ? MaybeSlug extends `[${infer Slug}]`
        ? _GetSlugs<Route, Rest, [...Result, Slug]>
        : _GetSlugs<Route, Rest, Result>
      : never
    : Result;

export type GetSlugs<Route extends string> = _GetSlugs<Route>;

export type StaticSlugRoutePathsTuple<
  T extends string,
  Slugs extends unknown[] = GetSlugs<T>,
  Result extends string[] = [],
> = Slugs extends []
  ? Result
  : Slugs extends [infer _, ...infer Rest]
    ? StaticSlugRoutePathsTuple<T, Rest, [...Result, string]>
    : never;

type StaticSlugRoutePaths<T extends string> =
  HasWildcardInPath<T> extends true
    ? string[] | string[][]
    : StaticSlugRoutePathsTuple<T> extends [string]
      ? string[]
      : StaticSlugRoutePathsTuple<T>[];

export type PathWithoutSlug<T> = T extends '/'
  ? T
  : IsValidPathInSlugPath<T> extends true
    ? HasSlugInPath<T, string> extends true
      ? never
      : T
    : never;

type PathWithStaticSlugs<T extends string> = T extends `/`
  ? T
  : IsValidPathInSlugPath<T> extends true
    ? T
    : never;

export type PathWithWildcard<
  Path,
  SlugKey extends string,
  WildSlugKey extends string,
> = PathWithSlug<Path, SlugKey | `...${WildSlugKey}`>;

export type CreatePage = <Path extends string, SlugKey extends string, WildSlugKey extends string>(
  page: (
    | {
        render: 'static';
        path: PathWithoutSlug<Path>;
        component: FunctionComponent<RouteProps>;
      }
    | {
        render: 'static';
        path: PathWithStaticSlugs<Path>;
        staticPaths: StaticSlugRoutePaths<Path>;
        component: FunctionComponent<RouteProps & Record<SlugKey, string>>;
      }
    | {
        render: 'dynamic';
        path: PathWithoutSlug<Path>;
        component: FunctionComponent<RouteProps>;
      }
    | {
        render: 'dynamic';
        path: PathWithWildcard<Path, SlugKey, WildSlugKey>;
        component: FunctionComponent<
          RouteProps & Record<SlugKey, string> & Record<WildSlugKey, string[]>
        >;
      }
  ) & { unstable_disableSSR?: boolean }
) => void;

export type CreateLayout = <T extends string>(layout: {
  render: 'static' | 'dynamic';
  path: PathWithoutSlug<T>;
  component: FunctionComponent<Omit<RouteProps, 'searchParams'> & { children: ReactNode }>;
}) => void;

export function createPages(
  fn: (
    fns: {
      createPage: CreatePage;
      createLayout: CreateLayout;
      unstable_setBuildData: (path: string, data: unknown) => void;
    },
    opts: {
      unstable_buildConfig: BuildConfig | undefined;
    }
  ) => Promise<void>
) {
  let configured = false;

  // TODO I think there's room for improvement to refactor these structures
  const staticPathSet = new Set<[string, PathSpec]>();
  const dynamicPagePathMap = new Map<string, [PathSpec, FunctionComponent<any>]>();
  const wildcardPagePathMap = new Map<string, [PathSpec, FunctionComponent<any>]>();
  const dynamicLayoutPathMap = new Map<string, [PathSpec, FunctionComponent<any>]>();
  const staticComponentMap = new Map<string, FunctionComponent<any>>();
  const noSsrSet = new WeakSet<PathSpec>();
  const buildDataMap = new Map<string, unknown>();

  const registerStaticComponent = (id: string, component: FunctionComponent<any>) => {
    if (staticComponentMap.has(id) && staticComponentMap.get(id) !== component) {
      throw new Error(`Duplicated component for: ${id}`);
    }
    staticComponentMap.set(id, component);
  };

  const createPage: CreatePage = (page) => {
    if (configured) {
      throw new Error('no longer available');
    }
    const pathSpec = parsePathWithSlug(page.path);
    if (page.unstable_disableSSR) {
      noSsrSet.add(pathSpec);
    }
    const { numSlugs, numWildcards } = (() => {
      let numSlugs = 0;
      let numWildcards = 0;
      for (const slug of pathSpec) {
        if (slug.type !== 'literal') {
          numSlugs++;
        }
        if (slug.type === 'wildcard') {
          numWildcards++;
        }
      }
      return { numSlugs, numWildcards };
    })();
    if (page.render === 'static' && numSlugs === 0) {
      staticPathSet.add([page.path, pathSpec]);
      const id = joinPath(page.path, 'page').replace(/^\//, '');
      registerStaticComponent(id, page.component);
    } else if (page.render === 'static' && numSlugs > 0 && 'staticPaths' in page) {
      const staticPaths = page.staticPaths.map((item) =>
        (Array.isArray(item) ? item : [item]).map(sanitizeSlug)
      );
      for (const staticPath of staticPaths) {
        if (staticPath.length !== numSlugs && numWildcards === 0) {
          throw new Error('staticPaths does not match with slug pattern');
        }
        const mapping: Record<string, string | string[]> = {};
        let slugIndex = 0;
        const pathItems: string[] = [];
        pathSpec.forEach(({ type, name }) => {
          switch (type) {
            case 'literal':
              pathItems.push(name!);
              break;
            case 'wildcard':
              mapping[name!] = staticPath.slice(slugIndex);
              staticPath.slice(slugIndex++).forEach((slug) => {
                pathItems.push(slug);
              });
              break;
            case 'group':
              pathItems.push(staticPath[slugIndex++]!);
              mapping[name!] = pathItems[pathItems.length - 1]!;
              break;
          }
        });
        staticPathSet.add([page.path, pathItems.map((name) => ({ type: 'literal', name }))]);
        const id = joinPath(...pathItems, 'page');
        const WrappedComponent = (props: Record<string, unknown>) =>
          createElement(page.component as any, { ...props, ...mapping });
        registerStaticComponent(id, WrappedComponent);
      }
    } else if (page.render === 'dynamic' && numWildcards === 0) {
      if (dynamicPagePathMap.has(page.path)) {
        throw new Error(`Duplicated dynamic path: ${page.path}`);
      }
      dynamicPagePathMap.set(page.path, [pathSpec, page.component]);
    } else if (page.render === 'dynamic' && numWildcards === 1) {
      if (wildcardPagePathMap.has(page.path)) {
        throw new Error(`Duplicated dynamic path: ${page.path}`);
      }
      wildcardPagePathMap.set(page.path, [pathSpec, page.component]);
    } else {
      throw new Error('Invalid page configuration');
    }
  };

  const createLayout: CreateLayout = (layout) => {
    if (configured) {
      throw new Error('no longer available');
    }
    if (layout.render === 'static') {
      const id = joinPath(layout.path, 'layout').replace(/^\//, '');
      registerStaticComponent(id, layout.component);
    } else if (layout.render === 'dynamic') {
      if (dynamicLayoutPathMap.has(layout.path)) {
        throw new Error(`Duplicated dynamic path: ${layout.path}`);
      }
      const pathSpec = parsePathWithSlug(layout.path);
      dynamicLayoutPathMap.set(layout.path, [pathSpec, layout.component]);
    } else {
      throw new Error('Invalid layout configuration');
    }
  };

  const unstable_setBuildData = (path: string, data: unknown) => {
    buildDataMap.set(path, data);
  };

  let ready: Promise<void> | undefined;
  const configure = async (buildConfig?: BuildConfig) => {
    if (!configured && !ready) {
      ready = fn(
        { createPage, createLayout, unstable_setBuildData },
        { unstable_buildConfig: buildConfig }
      );
      await ready;
      configured = true;
    }
    await ready;
  };

  return unstable_defineRouter(
    async () => {
      await configure();
      const paths: {
        pattern: string;
        path: PathSpec;
        isStatic: boolean;
        noSsr: boolean;
        data: unknown;
      }[] = [];
      for (const [path, pathSpec] of staticPathSet) {
        const noSsr = noSsrSet.has(pathSpec);
        const isStatic = (() => {
          for (const [_, [layoutPathSpec]] of dynamicLayoutPathMap) {
            if (hasPathSpecPrefix(layoutPathSpec, pathSpec)) {
              return false;
            }
          }
          return true;
        })();

        paths.push({
          pattern: path2regexp(parsePathWithSlug(path)),
          path: pathSpec,
          isStatic,
          noSsr,
          data: buildDataMap.get(path),
        });
      }
      for (const [path, [pathSpec]] of dynamicPagePathMap) {
        const noSsr = noSsrSet.has(pathSpec);
        paths.push({
          pattern: path2regexp(parsePathWithSlug(path)),
          path: pathSpec,
          isStatic: false,
          noSsr,
          data: buildDataMap.get(path),
        });
      }
      for (const [path, [pathSpec]] of wildcardPagePathMap) {
        const noSsr = noSsrSet.has(pathSpec);
        paths.push({
          pattern: path2regexp(parsePathWithSlug(path)),
          path: pathSpec,
          isStatic: false,
          noSsr,
          data: buildDataMap.get(path),
        });
      }
      return paths;
    },
    async (id, { unstable_setShouldSkip, unstable_buildConfig }) => {
      await configure(unstable_buildConfig);
      const staticComponent = staticComponentMap.get(id);
      if (staticComponent) {
        unstable_setShouldSkip([]);
        return staticComponent;
      }
      for (const [_, [pathSpec, Component]] of dynamicPagePathMap) {
        const mapping = getPathMapping([...pathSpec, { type: 'literal', name: 'page' }], id);
        if (mapping) {
          if (Object.keys(mapping).length === 0) {
            unstable_setShouldSkip();
            return Component;
          }
          const WrappedComponent = (props: Record<string, unknown>) =>
            createElement(Component, { ...props, ...mapping });
          unstable_setShouldSkip();
          return WrappedComponent;
        }
      }
      for (const [_, [pathSpec, Component]] of wildcardPagePathMap) {
        const mapping = getPathMapping([...pathSpec, { type: 'literal', name: 'page' }], id);
        if (mapping) {
          const WrappedComponent = (props: Record<string, unknown>) =>
            createElement(Component, { ...props, ...mapping });
          unstable_setShouldSkip();
          return WrappedComponent;
        }
      }
      for (const [_, [pathSpec, Component]] of dynamicLayoutPathMap) {
        const mapping = getPathMapping([...pathSpec, { type: 'literal', name: 'layout' }], id);
        if (mapping) {
          if (Object.keys(mapping).length) {
            throw new Error('[Bug] layout should not have slugs');
          }
          unstable_setShouldSkip();
          return Component;
        }
      }
      unstable_setShouldSkip([]); // negative cache
      return null; // not found
    }
  );
}
