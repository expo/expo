import { matchDynamicName } from 'expo-router/internal/routing';
import type { RouteProps } from 'expo-router/internal/rsc';
import { createElement } from 'react';
import type { FunctionComponent, ReactNode } from 'react';

import { unstable_defineRouter } from './defineRouter';
import { getNamedParametrizedRoute } from '../../getServerManifest';
import type { BuildConfig } from '../server';

type ComponentKind = 'page' | 'layout';
type SlugMapping = Record<string, string | string[]>;
type IdMatcher = (id: string) => SlugMapping | null;

type Entry = {
  /** Registered path, may contain `[slug]`, `[...wildcard]`, or `(group)` segments. */
  path: string;
  component: FunctionComponent<any>;
  kind: ComponentKind;
  /** True if the path contains any slug or wildcard segments. */
  isDynamic: boolean;
  /** True if the path contains a wildcard `[...rest]` segment. */
  isWildcard: boolean;
  noSsr: boolean;
  matchId: IdMatcher;
  matchesPathname: (pathname: string) => boolean;
};

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

function compilePathMatcher(path: string, suffix?: 'page' | 'layout'): IdMatcher {
  // Reuse expo-router-server's canonical regex builder so RSC matching agrees with
  // the URL manifest about brackets, group routes (optional), wildcards, and +not-found.
  const { namedParameterizedRoute, routeKeys, wildcardKeys } = getNamedParametrizedRoute(path);
  // Strip a trailing slash before appending the suffix so the root path doesn't
  // produce `//page` when concatenated.
  const base = namedParameterizedRoute.replace(/\/$/, '');
  const regex = new RegExp(`^${suffix ? `${base}/${suffix}` : base}/?$`);
  return (target) => {
    // Targets are either IDs (`posts/123/page`) or pathnames (`/posts/123`).
    // The canonical regex expects a leading slash, so add one for IDs.
    const match = regex.exec(target.startsWith('/') ? target : '/' + target);
    if (!match) return null;
    const params: SlugMapping = {};
    for (const [cleanedKey, originalName] of Object.entries(routeKeys)) {
      const value = match.groups?.[cleanedKey];
      if (value === undefined) continue;
      params[originalName] = wildcardKeys.has(cleanedKey) ? value.split('/') : value;
    }
    return params;
  };
}

function buildMatchesPathname(path: string): (pathname: string) => boolean {
  const matcher = compilePathMatcher(path);
  return (pathname) => matcher(pathname) != null;
}

function isDynamicPath(path: string): boolean {
  return path.split('/').some((segment) => matchDynamicName(segment) != null);
}

function hasPathPrefix(prefix: string, path: string): boolean {
  return path === prefix || path.startsWith(prefix + '/');
}

/** Normalize a registration path to a URL-shaped pathname (always starts with `/`). */
function normalizePath(path: string): string {
  if (path === '' || path === '/') return '/';
  return path.startsWith('/') ? path : '/' + path;
}

function sanitizeSlug(slug: string): string {
  return slug.replace(/\./g, '').replace(/ /g, '-');
}

/**
 * Build an RSC router from a registration callback. Imitates `expo-server`'s
 * URL routing: each registered component carries a regex matcher, and the
 * resolver iterates the registry in specificity order, first match wins.
 * No exact-key lookup: this lets paths with `(group)` segments match runtime
 * IDs that don't include them.
 */
export function createPages(fn: CreatePagesFn): ReturnType<typeof unstable_defineRouter> {
  let configured = false;
  const entriesByKey = new Map<string, Entry>();
  const buildDataMap = new Map<string, unknown>();
  let sortedEntries: Entry[] = [];

  const register = (entry: Entry) => {
    const key = `${entry.kind}:${entry.path}`;
    const existing = entriesByKey.get(key);
    if (existing && existing.component !== entry.component) {
      throw new Error(`Duplicated component for ${entry.kind}: ${entry.path}`);
    }
    entriesByKey.set(key, entry);
  };

  const createPage = (page: CreatePageInput): void => {
    if (configured) {
      throw new Error('no longer available');
    }
    // Normalize once up-front: top-level `./index.tsx` arrives as `''`, and
    // everything downstream (the matcher, the registry key, the resolver) wants
    // a URL-shaped pathname.
    const path = normalizePath(page.path);
    const noSsr = !!page.unstable_disableSSR;
    const segments = path.split('/').filter(Boolean);
    let numSlugs = 0;
    let numWildcards = 0;
    for (const segment of segments) {
      const dynamic = matchDynamicName(segment);
      if (!dynamic) continue;
      numSlugs++;
      if (dynamic.deep) numWildcards++;
    }

    if (page.render === 'static' && numSlugs === 0) {
      register({
        path,
        component: page.component,
        kind: 'page',
        isDynamic: false,
        isWildcard: false,
        noSsr,
        matchId: compilePathMatcher(path, 'page'),
        matchesPathname: buildMatchesPathname(path),
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
        for (const segment of segments) {
          const dynamic = matchDynamicName(segment);
          if (!dynamic) {
            pathItems.push(segment);
            continue;
          }
          if (dynamic.deep) {
            mapping[dynamic.name] = staticPath.slice(slugIndex);
            staticPath.slice(slugIndex++).forEach((slug) => pathItems.push(slug));
          } else {
            pathItems.push(staticPath[slugIndex++]!);
            mapping[dynamic.name] = pathItems[pathItems.length - 1]!;
          }
        }
        const concretePath = '/' + pathItems.join('/');
        const WrappedComponent = (props: Record<string, unknown>) =>
          createElement(page.component as any, { ...props, ...mapping });
        register({
          path: concretePath,
          component: WrappedComponent,
          kind: 'page',
          isDynamic: false,
          isWildcard: false,
          noSsr,
          matchId: compilePathMatcher(concretePath, 'page'),
          matchesPathname: buildMatchesPathname(concretePath),
        });
      }
      return;
    }

    if (page.render === 'dynamic') {
      if (numWildcards > 1) {
        throw new Error('Invalid page configuration: ' + path);
      }
      register({
        path,
        component: page.component,
        kind: 'page',
        isDynamic: true,
        isWildcard: numWildcards === 1,
        noSsr,
        matchId: compilePathMatcher(path, 'page'),
        matchesPathname: buildMatchesPathname(path),
      });
      return;
    }

    throw new Error('Invalid page configuration: ' + path);
  };

  const createLayout = (layout: CreateLayoutInput): void => {
    if (configured) {
      throw new Error('no longer available');
    }
    if (layout.render !== 'static' && layout.render !== 'dynamic') {
      throw new Error('Invalid layout configuration');
    }
    const path = normalizePath(layout.path);
    register({
      path,
      component: layout.component as FunctionComponent<any>,
      kind: 'layout',
      isDynamic: layout.render === 'dynamic' || isDynamicPath(path),
      isWildcard: false,
      noSsr: false,
      matchId: compilePathMatcher(path, 'layout'),
      matchesPathname: buildMatchesPathname(path),
    });
  };

  const unstable_setBuildData = (path: string, data: unknown) => {
    // Key by the same normalized pathname `register` uses, so the lookup at
    // `buildDataMap.get(entry.path)` finds it regardless of caller convention.
    buildDataMap.set(normalizePath(path), data);
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
      // Resolver iterates this once per request and takes the first matchId hit.
      // Non-wildcard pages must out-rank wildcards so a more specific path wins; the
      // matcher's `/page` vs `/layout` suffix prevents cross-kind false matches, so
      // page-vs-layout order is irrelevant.
      sortedEntries = Array.from(entriesByKey.values()).sort(
        (a, b) => Number(a.isWildcard) - Number(b.isWildcard)
      );
    }
    await ready;
  };

  return unstable_defineRouter(
    async () => {
      await configure();
      const dynamicLayoutPaths: string[] = [];
      for (const entry of sortedEntries) {
        if (entry.kind === 'layout' && entry.isDynamic) dynamicLayoutPaths.push(entry.path);
      }
      const isUnderDynamicLayout = (pagePath: string) =>
        dynamicLayoutPaths.some((lp) => hasPathPrefix(lp, pagePath));

      const paths: {
        path: string;
        matchesPathname: (pathname: string) => boolean;
        isStatic: boolean;
        noSsr: boolean;
        data: unknown;
      }[] = [];
      for (const entry of sortedEntries) {
        if (entry.kind !== 'page') continue;
        paths.push({
          path: entry.path,
          matchesPathname: entry.matchesPathname,
          isStatic: !entry.isDynamic && !isUnderDynamicLayout(entry.path),
          noSsr: entry.noSsr,
          data: buildDataMap.get(entry.path),
        });
      }
      return paths;
    },
    async (id, { unstable_setShouldSkip, unstable_buildConfig }) => {
      await configure(unstable_buildConfig);
      for (const entry of sortedEntries) {
        const mapping = entry.matchId(id);
        if (!mapping) continue;
        if (entry.kind === 'layout') {
          if (Object.keys(mapping).length) {
            throw new Error('[Bug] layout should not have slugs');
          }
          // Layouts never opt into shouldSkipObj — they must render on every request to
          // enforce their auth/loader effects.
          return {
            component: entry.component as FunctionComponent<
              Omit<RouteProps, 'searchParams'> & { children: ReactNode }
            >,
            kind: 'layout',
          };
        }
        // Static pages opt into shouldSkipObj so the client can cache them across
        // navigations. Dynamic pages don't (their content depends on slugs).
        if (entry.isDynamic) {
          unstable_setShouldSkip();
        } else {
          unstable_setShouldSkip([]);
        }
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
