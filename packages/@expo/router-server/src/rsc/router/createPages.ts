import { matchDynamicName } from 'expo-router/internal/routing';
import type { RouteProps } from 'expo-router/internal/rsc';
import { createElement } from 'react';
import type { FunctionComponent, ReactNode } from 'react';

import { unstable_defineRouter } from './defineRouter';
import { joinPath } from '../path';
import type { PathSpec, PathSpecItem } from '../path';
import type { BuildConfig } from '../server';

type ComponentKind = 'page' | 'layout';
type SlugMapping = Record<string, string | string[]>;
type IdMatcher = (id: string) => SlugMapping | null;

type StaticEntry = {
  id: string;
  /** Path used for prefix checks (literal pathname, e.g. `/posts/1`). */
  path: string;
  component: FunctionComponent<any>;
  kind: ComponentKind;
  noSsr: boolean;
  matchesPathname: (pathname: string) => boolean;
};

type DynamicEntry = {
  /** Registered path with brackets for dynamic segments, e.g. `/posts/[id]`. */
  path: string;
  component: FunctionComponent<any>;
  kind: ComponentKind;
  isWildcard: boolean;
  matchId: IdMatcher;
  noSsr: boolean;
  matchesPathname: (pathname: string) => boolean;
};

function buildMatchesPathname(path: string): (pathname: string) => boolean {
  const matcher = compilePathMatcher(path);
  return (pathname) => matcher(pathname) != null;
}

export type CreatePageInput = {
  path: string;
  component: FunctionComponent<any>;
  render: 'static' | 'dynamic';
  staticPaths?: (string | string[])[];
  unstable_disableSSR?: boolean;
};

export type CreateLayoutInput = {
  path: string;
  component: FunctionComponent<Omit<RouteProps, 'searchParams'> & { children: ReactNode }>;
  render: 'static' | 'dynamic';
};

export type CreatePagesApi = {
  createPage: (page: CreatePageInput) => void;
  createLayout: (layout: CreateLayoutInput) => void;
  unstable_setBuildData: (path: string, data: unknown) => void;
};

export type CreatePagesFn = (
  api: CreatePagesApi,
  opts: { unstable_buildConfig: BuildConfig | undefined }
) => Promise<void>;

const REGEX_ESCAPE = /[.*+?^${}()|[\]\\]/g;

function parsePathSpec(path: string): PathSpec {
  return path
    .split('/')
    .filter(Boolean)
    .map((segment): PathSpecItem => {
      const match = matchDynamicName(segment);
      if (!match) return { type: 'literal', name: segment };
      return match.deep
        ? { type: 'wildcard', name: match.name }
        : { type: 'group', name: match.name };
    });
}

function compilePathMatcher(path: string, suffix?: 'page' | 'layout'): IdMatcher {
  const slugs: { name: string; deep: boolean }[] = [];
  const parts: string[] = [];
  for (const segment of path.split('/').filter(Boolean)) {
    const dynamic = matchDynamicName(segment);
    if (dynamic) {
      slugs.push(dynamic);
      parts.push(dynamic.deep ? '(.+?)' : '([^/]+)');
    } else {
      parts.push(segment.replace(REGEX_ESCAPE, '\\$&'));
    }
  }
  if (suffix) parts.push(suffix);
  const regex = new RegExp(`^/?${parts.join('/')}$`);
  return (target) => {
    const match = regex.exec(target);
    if (!match) return null;
    const params: SlugMapping = {};
    for (let i = 0; i < slugs.length; i++) {
      const value = match[i + 1];
      if (value === undefined) continue;
      const slug = slugs[i]!;
      params[slug.name] = slug.deep ? value.split('/') : value;
    }
    return params;
  };
}

function hasPathPrefix(prefix: string, path: string): boolean {
  return path === prefix || path.startsWith(prefix + '/');
}

function sanitizeSlug(slug: string): string {
  return slug.replace(/\./g, '').replace(/ /g, '-');
}

/**
 * Build an RSC router from a registration callback. The callback receives a
 * `createPage`/`createLayout` API that records entries into an ID-keyed registry.
 */
export function createPages(fn: CreatePagesFn): ReturnType<typeof unstable_defineRouter> {
  let configured = false;
  const staticPageIdToEntry = new Map<string, StaticEntry>();
  const staticLayoutIdToEntry = new Map<string, StaticEntry>();
  const dynamicEntries: DynamicEntry[] = [];
  const buildDataMap = new Map<string, unknown>();

  const registerStatic = (entry: StaticEntry) => {
    const target = entry.kind === 'page' ? staticPageIdToEntry : staticLayoutIdToEntry;
    const existing = target.get(entry.id);
    if (existing && existing.component !== entry.component) {
      throw new Error(`Duplicated component for: ${entry.id}`);
    }
    target.set(entry.id, entry);
  };

  const ensureUniqueDynamic = (path: string, kind: ComponentKind) => {
    if (dynamicEntries.some((e) => e.path === path && e.kind === kind)) {
      throw new Error(`Duplicated dynamic path: ${path}`);
    }
  };

  const createPage = (page: CreatePageInput): void => {
    if (configured) {
      throw new Error('no longer available');
    }
    const noSsr = !!page.unstable_disableSSR;
    const pathSpec = parsePathSpec(page.path);
    let numSlugs = 0;
    let numWildcards = 0;
    for (const item of pathSpec) {
      if (item.type !== 'literal') numSlugs++;
      if (item.type === 'wildcard') numWildcards++;
    }

    if (page.render === 'static' && numSlugs === 0) {
      const id = joinPath(page.path, 'page').replace(/^\//, '');
      registerStatic({
        id,
        path: page.path,
        component: page.component,
        kind: 'page',
        noSsr,
        matchesPathname: buildMatchesPathname(page.path),
      });
      return;
    }

    if (page.render === 'static' && numSlugs > 0) {
      if (!page.staticPaths) {
        throw new Error('staticPaths is required for static pages with slugs');
      }
      const staticPaths = page.staticPaths.map((item) =>
        (Array.isArray(item) ? item : [item]).map(sanitizeSlug)
      );
      for (const staticPath of staticPaths) {
        if (staticPath.length !== numSlugs && numWildcards === 0) {
          throw new Error('staticPaths does not match with slug pattern');
        }
        const mapping: SlugMapping = {};
        let slugIndex = 0;
        const pathItems: string[] = [];
        for (const { type, name } of pathSpec) {
          switch (type) {
            case 'literal':
              pathItems.push(name!);
              break;
            case 'wildcard':
              mapping[name!] = staticPath.slice(slugIndex);
              staticPath.slice(slugIndex++).forEach((slug) => pathItems.push(slug));
              break;
            case 'group':
              pathItems.push(staticPath[slugIndex++]!);
              mapping[name!] = pathItems[pathItems.length - 1]!;
              break;
          }
        }
        const id = joinPath(...pathItems, 'page');
        const concretePath = '/' + pathItems.join('/');
        const WrappedComponent = (props: Record<string, unknown>) =>
          createElement(page.component as any, { ...props, ...mapping });
        registerStatic({
          id,
          path: concretePath,
          component: WrappedComponent,
          kind: 'page',
          noSsr,
          matchesPathname: buildMatchesPathname(concretePath),
        });
      }
      return;
    }

    if (page.render === 'dynamic') {
      if (numWildcards > 1) {
        throw new Error('Invalid page configuration: ' + page.path);
      }
      ensureUniqueDynamic(page.path, 'page');
      dynamicEntries.push({
        path: page.path,
        component: page.component,
        kind: 'page',
        isWildcard: numWildcards === 1,
        matchId: compilePathMatcher(page.path, 'page'),
        noSsr,
        matchesPathname: buildMatchesPathname(page.path),
      });
      return;
    }

    throw new Error('Invalid page configuration: ' + page.path);
  };

  const createLayout = (layout: CreateLayoutInput): void => {
    if (configured) {
      throw new Error('no longer available');
    }
    if (layout.render === 'static') {
      const id = joinPath(layout.path, 'layout').replace(/^\//, '');
      registerStatic({
        id,
        path: layout.path,
        component: layout.component as FunctionComponent<any>,
        kind: 'layout',
        noSsr: false,
        matchesPathname: buildMatchesPathname(layout.path),
      });
      return;
    }
    if (layout.render === 'dynamic') {
      ensureUniqueDynamic(layout.path, 'layout');
      dynamicEntries.push({
        path: layout.path,
        component: layout.component as FunctionComponent<any>,
        kind: 'layout',
        isWildcard: false,
        matchId: compilePathMatcher(layout.path, 'layout'),
        noSsr: false,
        matchesPathname: buildMatchesPathname(layout.path),
      });
      return;
    }
    throw new Error('Invalid layout configuration');
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
      // Non-wildcard pages must take priority over wildcard pages so a more
      // specific match wins. Layouts and pages don't collide (different ID
      // suffix), so layout order doesn't matter.
      dynamicEntries.sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === 'page' ? -1 : 1;
        if (a.kind === 'page') {
          if (a.isWildcard !== b.isWildcard) return a.isWildcard ? 1 : -1;
        }
        return 0;
      });
    }
    await ready;
  };

  return unstable_defineRouter(
    async () => {
      await configure();
      const dynamicLayoutPaths: string[] = [];
      for (const entry of dynamicEntries) {
        if (entry.kind === 'layout') dynamicLayoutPaths.push(entry.path);
      }
      const isUnderDynamicLayout = (pagePath: string) =>
        dynamicLayoutPaths.some((lp) => hasPathPrefix(lp, pagePath));

      const paths: {
        path: PathSpec;
        matchesPathname: (pathname: string) => boolean;
        isStatic: boolean;
        noSsr: boolean;
        data: unknown;
      }[] = [];
      for (const entry of staticPageIdToEntry.values()) {
        paths.push({
          path: parsePathSpec(entry.path),
          matchesPathname: entry.matchesPathname,
          isStatic: !isUnderDynamicLayout(entry.path),
          noSsr: entry.noSsr,
          data: buildDataMap.get(entry.path),
        });
      }
      for (const entry of dynamicEntries) {
        if (entry.kind !== 'page') continue;
        paths.push({
          path: parsePathSpec(entry.path),
          matchesPathname: entry.matchesPathname,
          isStatic: false,
          noSsr: entry.noSsr,
          data: buildDataMap.get(entry.path),
        });
      }
      return paths;
    },
    async (id, { unstable_setShouldSkip, unstable_buildConfig }) => {
      await configure(unstable_buildConfig);
      const staticPage = staticPageIdToEntry.get(id);
      if (staticPage) {
        unstable_setShouldSkip([]);
        return {
          component: staticPage.component as FunctionComponent<RouteProps>,
          kind: 'page',
        };
      }
      const staticLayout = staticLayoutIdToEntry.get(id);
      if (staticLayout) {
        return {
          component: staticLayout.component as FunctionComponent<
            Omit<RouteProps, 'searchParams'> & { children: ReactNode }
          >,
          kind: 'layout',
        };
      }
      for (const entry of dynamicEntries) {
        const mapping = entry.matchId(id);
        if (!mapping) continue;
        if (entry.kind === 'layout') {
          if (Object.keys(mapping).length) {
            throw new Error('[Bug] layout should not have slugs');
          }
          unstable_setShouldSkip();
          return {
            component: entry.component as FunctionComponent<
              Omit<RouteProps, 'searchParams'> & { children: ReactNode }
            >,
            kind: 'layout',
          };
        }
        unstable_setShouldSkip();
        if (Object.keys(mapping).length === 0) {
          return { component: entry.component as FunctionComponent<RouteProps>, kind: 'page' };
        }
        const WrappedComponent = (props: Record<string, unknown>) =>
          createElement(entry.component, { ...props, ...mapping });
        return { component: WrappedComponent as FunctionComponent<RouteProps>, kind: 'page' };
      }
      unstable_setShouldSkip([]);
      return null;
    }
  );
}
