"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPages = createPages;
const routing_1 = require("expo-router/internal/routing");
const react_1 = require("react");
const defineRouter_1 = require("./defineRouter");
const getNamedParametrizedRoute_1 = require("../../getNamedParametrizedRoute");
function compilePathMatcher(path, suffix) {
    // Reuse expo-router-server's canonical regex builder so RSC matching agrees with
    // the URL manifest about brackets, group routes (optional), wildcards, and +not-found.
    const { namedParameterizedRoute, routeKeys, wildcardKeys } = (0, getNamedParametrizedRoute_1.getNamedParametrizedRoute)(path);
    // Strip a trailing slash before appending the suffix so the root path doesn't
    // produce `//page` when concatenated.
    const base = namedParameterizedRoute.replace(/\/$/, '');
    const regex = new RegExp(`^${suffix ? `${base}/${suffix}` : base}/?$`);
    return (target) => {
        // Targets are either IDs (`posts/123/page`) or pathnames (`/posts/123`).
        // The canonical regex expects a leading slash, so add one for IDs.
        const match = regex.exec(target.startsWith('/') ? target : '/' + target);
        if (!match)
            return null;
        const params = {};
        for (const [cleanedKey, originalName] of Object.entries(routeKeys)) {
            const value = match.groups?.[cleanedKey];
            if (value === undefined)
                continue;
            params[originalName] = wildcardKeys.has(cleanedKey) ? value.split('/') : value;
        }
        return params;
    };
}
function buildMatchesPathname(path) {
    const matcher = compilePathMatcher(path);
    return (pathname) => matcher(pathname) != null;
}
function isDynamicPath(path) {
    return path.split('/').some((segment) => (0, routing_1.matchDynamicName)(segment) != null);
}
function hasPathPrefix(prefix, path) {
    return path === prefix || path.startsWith(prefix + '/');
}
/** Normalize a registration path to a URL-shaped pathname (always starts with `/`). */
function normalizePath(path) {
    if (path === '' || path === '/')
        return '/';
    return path.startsWith('/') ? path : '/' + path;
}
function sanitizeSlug(slug) {
    return slug.replace(/\./g, '').replace(/ /g, '-');
}
/**
 * Build an RSC router from a registration callback. Imitates `expo-server`'s
 * URL routing: each registered component carries a regex matcher, and the
 * resolver iterates the registry in specificity order, first match wins.
 * No exact-key lookup: this lets paths with `(group)` segments match runtime
 * IDs that don't include them.
 */
function createPages(fn) {
    let configured = false;
    const entriesByKey = new Map();
    const buildDataMap = new Map();
    let sortedEntries = [];
    const register = (entry) => {
        const key = `${entry.kind}:${entry.path}`;
        const existing = entriesByKey.get(key);
        if (existing && existing.component !== entry.component) {
            throw new Error(`Duplicated component for ${entry.kind}: ${entry.path}`);
        }
        entriesByKey.set(key, entry);
    };
    const createPage = (page) => {
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
            const dynamic = (0, routing_1.matchDynamicName)(segment);
            if (!dynamic)
                continue;
            numSlugs++;
            if (dynamic.deep)
                numWildcards++;
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
            const staticPaths = page.staticPaths.map((item) => (Array.isArray(item) ? item : [item]).map(sanitizeSlug));
            for (const staticPath of staticPaths) {
                if (staticPath.length !== numSlugs && numWildcards === 0) {
                    throw new Error('staticPaths does not match with slug pattern');
                }
                const mapping = {};
                let slugIndex = 0;
                const pathItems = [];
                for (const segment of segments) {
                    const dynamic = (0, routing_1.matchDynamicName)(segment);
                    if (!dynamic) {
                        pathItems.push(segment);
                        continue;
                    }
                    if (dynamic.deep) {
                        mapping[dynamic.name] = staticPath.slice(slugIndex);
                        staticPath.slice(slugIndex++).forEach((slug) => pathItems.push(slug));
                    }
                    else {
                        pathItems.push(staticPath[slugIndex++]);
                        mapping[dynamic.name] = pathItems[pathItems.length - 1];
                    }
                }
                const concretePath = '/' + pathItems.join('/');
                const WrappedComponent = (props) => (0, react_1.createElement)(page.component, { ...props, ...mapping });
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
    const createLayout = (layout) => {
        if (configured) {
            throw new Error('no longer available');
        }
        if (layout.render !== 'static' && layout.render !== 'dynamic') {
            throw new Error('Invalid layout configuration');
        }
        const path = normalizePath(layout.path);
        register({
            path,
            component: layout.component,
            kind: 'layout',
            isDynamic: layout.render === 'dynamic' || isDynamicPath(path),
            isWildcard: false,
            noSsr: false,
            matchId: compilePathMatcher(path, 'layout'),
            matchesPathname: buildMatchesPathname(path),
        });
    };
    const unstable_setBuildData = (path, data) => {
        // Key by the same normalized pathname `register` uses, so the lookup at
        // `buildDataMap.get(entry.path)` finds it regardless of caller convention.
        buildDataMap.set(normalizePath(path), data);
    };
    let ready;
    const configure = async (buildConfig) => {
        if (!configured && !ready) {
            ready = fn({ createPage, createLayout, unstable_setBuildData }, { unstable_buildConfig: buildConfig });
            await ready;
            configured = true;
            // Resolver iterates this once per request and takes the first matchId hit.
            // Non-wildcard pages must out-rank wildcards so a more specific path wins; the
            // matcher's `/page` vs `/layout` suffix prevents cross-kind false matches, so
            // page-vs-layout order is irrelevant.
            sortedEntries = Array.from(entriesByKey.values()).sort((a, b) => Number(a.isWildcard) - Number(b.isWildcard));
        }
        await ready;
    };
    return (0, defineRouter_1.unstable_defineRouter)(async () => {
        await configure();
        const dynamicLayoutPaths = [];
        for (const entry of sortedEntries) {
            if (entry.kind === 'layout' && entry.isDynamic)
                dynamicLayoutPaths.push(entry.path);
        }
        const isUnderDynamicLayout = (pagePath) => dynamicLayoutPaths.some((lp) => hasPathPrefix(lp, pagePath));
        const paths = [];
        for (const entry of sortedEntries) {
            if (entry.kind !== 'page')
                continue;
            paths.push({
                path: entry.path,
                matchesPathname: entry.matchesPathname,
                isStatic: !entry.isDynamic && !isUnderDynamicLayout(entry.path),
                noSsr: entry.noSsr,
                data: buildDataMap.get(entry.path),
            });
        }
        return paths;
    }, async (id, { unstable_setShouldSkip, unstable_buildConfig }) => {
        await configure(unstable_buildConfig);
        for (const entry of sortedEntries) {
            const mapping = entry.matchId(id);
            if (!mapping)
                continue;
            if (entry.kind === 'layout') {
                if (Object.keys(mapping).length) {
                    throw new Error('[Bug] layout should not have slugs');
                }
                // Layouts never opt into shouldSkipObj — they must render on every request to
                // enforce their auth/loader effects.
                return {
                    component: entry.component,
                    kind: 'layout',
                };
            }
            // Static pages opt into shouldSkipObj so the client can cache them across
            // navigations. Dynamic pages don't (their content depends on slugs).
            if (entry.isDynamic) {
                unstable_setShouldSkip();
            }
            else {
                unstable_setShouldSkip([]);
            }
            if (Object.keys(mapping).length === 0) {
                return { component: entry.component, kind: 'page' };
            }
            const WrappedComponent = (props) => (0, react_1.createElement)(entry.component, { ...props, ...mapping });
            return { component: WrappedComponent, kind: 'page' };
        }
        unstable_setShouldSkip([]);
        return null;
    });
}
//# sourceMappingURL=createPages.js.map