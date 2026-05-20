"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unstable_defineRouter = unstable_defineRouter;
exports.unstable_redirect = unstable_redirect;
/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const rsc_1 = require("expo-router/internal/rsc");
const react_1 = require("react");
const server_1 = require("../server");
const safeJsonParse = (str) => {
    if (typeof str === 'string') {
        try {
            const obj = JSON.parse(str);
            if (typeof obj === 'object') {
                return obj;
            }
        }
        catch {
            // ignore
        }
    }
    return undefined;
};
const parseSkipList = (value) => {
    if (!Array.isArray(value))
        return new Set();
    return new Set(value.filter((v) => typeof v === 'string'));
};
function unstable_defineRouter(getPathConfig, getComponent) {
    let cachedPathConfig;
    const getMyPathConfig = async (buildConfig) => {
        if (buildConfig) {
            return buildConfig;
        }
        if (!cachedPathConfig) {
            cachedPathConfig = Array.from(await getPathConfig()).map((item) => ({
                pathname: item.path,
                matchesPathname: item.matchesPathname,
                isStatic: item.isStatic,
                customData: {
                    is404: item.path === '/404',
                    noSsr: !!item.noSsr,
                    data: item.data,
                },
            }));
        }
        return cachedPathConfig;
    };
    const existsPath = async (pathname, buildConfig) => {
        const pathConfig = await getMyPathConfig(buildConfig);
        const found = pathConfig.find(({ matchesPathname }) => matchesPathname(pathname));
        return found
            ? found.customData.noSsr
                ? ['FOUND', 'NO_SSR']
                : ['FOUND']
            : pathConfig.some(({ customData: { is404 } }) => is404) // FIXMEs should avoid re-computation
                ? ['NOT_FOUND', 'HAS_404']
                : ['NOT_FOUND'];
    };
    const renderEntries = async (input, { params, buildConfig }) => {
        const pathname = (0, rsc_1.parseInputString)(input);
        if ((await existsPath(pathname, buildConfig))[0] === 'NOT_FOUND') {
            return null;
        }
        const shouldSkipObj = {};
        const parsedParams = safeJsonParse(params);
        const query = typeof parsedParams?.query === 'string' ? parsedParams.query : '';
        const skip = parseSkipList(parsedParams?.skip);
        const { layouts, page } = (0, rsc_1.getComponentIds)(pathname);
        const entries = (await Promise.all([...layouts, page].map(async (id) => {
            // `getComponentIds` separates the terminal page from layouts. Use that
            // structural distinction as a fast-path skip (kind isn't known until we
            // resolve); the kind-based check after resolve is the authoritative defense.
            const isPage = id === page;
            if (isPage && skip.has(id)) {
                return [];
            }
            const setShouldSkip = (val) => {
                if (val) {
                    shouldSkipObj[id] = val;
                }
                else {
                    delete shouldSkipObj[id];
                }
            };
            const resolved = await getComponent(id, {
                unstable_setShouldSkip: setShouldSkip,
                unstable_buildConfig: buildConfig,
            });
            if (!resolved) {
                return [];
            }
            // Honor skip only for entries the resolver opted into shouldSkipObj; layouts are never skippable.
            if (skip.has(id) && resolved.kind !== 'layout' && shouldSkipObj[id] != null) {
                return [];
            }
            const element = (0, react_1.createElement)(resolved.component, isPage ? { path: pathname, query } : { path: pathname }, (0, react_1.createElement)(rsc_1.Children));
            return [[id, element]];
        }))).flat();
        entries.push([rsc_1.SHOULD_SKIP_ID, Object.entries(shouldSkipObj)]);
        entries.push([rsc_1.LOCATION_ID, [pathname, query]]);
        return Object.fromEntries(entries);
    };
    const getBuildConfig = async (unstable_collectClientModules) => {
        const pathConfig = await getMyPathConfig();
        const path2moduleIds = {};
        for (const { pathname } of pathConfig) {
            if (pathname.includes('[')) {
                continue;
            }
            const input = (0, rsc_1.getInputString)(pathname);
            const moduleIds = await unstable_collectClientModules(input);
            path2moduleIds[pathname] = moduleIds;
        }
        const customCode = `
globalThis.__EXPO_ROUTER_PREFETCH__ = (path) => {
  const path2ids = ${JSON.stringify(path2moduleIds)};
  for (const id of path2ids[path] || []) {
    import(id);
  }
};`;
        const buildConfig = [];
        for (const { pathname, isStatic, customData } of pathConfig) {
            const entries = [];
            if (!pathname.includes('[')) {
                const input = (0, rsc_1.getInputString)(pathname);
                entries.push({ input, isStatic });
            }
            buildConfig.push({
                pathname,
                isStatic,
                entries,
                customCode,
                customData,
            });
        }
        return buildConfig;
    };
    const getSsrConfig = async (pathname, { searchParams, buildConfig }) => {
        const pathStatus = await existsPath(pathname, buildConfig);
        if (pathStatus[1] === 'NO_SSR') {
            return null;
        }
        if (pathStatus[0] === 'NOT_FOUND') {
            if (pathStatus[1] === 'HAS_404') {
                pathname = '/404';
            }
            else {
                return null;
            }
        }
        const { layouts, page } = (0, rsc_1.getComponentIds)(pathname);
        const input = (0, rsc_1.getInputString)(pathname);
        const html = (0, react_1.createElement)(rsc_1.ServerRouter, { route: { path: pathname, query: searchParams.toString(), hash: '' } }, [...layouts, page].reduceRight((acc, id) => (0, react_1.createElement)(rsc_1.Slot, { id, fallback: acc }, acc), null));
        return {
            input,
            params: JSON.stringify({ query: searchParams.toString() }),
            html,
        };
    };
    return { renderEntries, getBuildConfig, getSsrConfig };
}
function unstable_redirect(pathname, searchParams, skip) {
    if (skip) {
        searchParams = new URLSearchParams(searchParams);
        for (const id of skip) {
            searchParams.append(rsc_1.PARAM_KEY_SKIP, id);
        }
    }
    const input = (0, rsc_1.getInputString)(pathname);
    (0, server_1.rerender)(input, searchParams);
}
//# sourceMappingURL=defineRouter.js.map