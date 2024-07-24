"use strict";
/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.unstable_redirect = exports.unstable_defineRouter = void 0;
const react_1 = require("react");
const client_1 = require("./client");
const common_1 = require("./common");
const host_1 = require("./host");
const path_1 = require("../path");
const server_1 = require("../server");
function unstable_defineRouter(getPathConfig, getComponent) {
    let cachedPathConfig;
    const getMyPathConfig = async (buildConfig) => {
        if (buildConfig) {
            return buildConfig;
        }
        if (!cachedPathConfig) {
            cachedPathConfig = Array.from(await getPathConfig()).map((item) => {
                return {
                    pathname: item.path,
                    isStatic: item.isStatic,
                    customData: { noSsr: !!item.noSsr, data: item.data },
                };
            });
        }
        return cachedPathConfig;
    };
    const existsPath = async (pathname, buildConfig) => {
        const pathConfig = await getMyPathConfig(buildConfig);
        const found = pathConfig.find(({ pathname: pathSpec }) => (0, path_1.getPathMapping)(pathSpec, pathname));
        return found ? (found.customData.noSsr ? ['FOUND', 'NO_SSR'] : ['FOUND']) : ['NOT_FOUND'];
    };
    const shouldSkipObj = {};
    const renderEntries = async (input, { searchParams, buildConfig }) => {
        const pathname = (0, common_1.parseInputString)(input);
        if ((await existsPath(pathname, buildConfig))[0] === 'NOT_FOUND') {
            return null;
        }
        const skip = searchParams.getAll(common_1.PARAM_KEY_SKIP) || [];
        searchParams.delete(common_1.PARAM_KEY_SKIP); // delete all
        const componentIds = (0, common_1.getComponentIds)(pathname);
        const entries = (await Promise.all(componentIds.map(async (id) => {
            if (skip?.includes(id)) {
                return [];
            }
            const setShoudSkip = (val) => {
                if (val) {
                    shouldSkipObj[id] = val;
                }
                else {
                    delete shouldSkipObj[id];
                }
            };
            const component = await getComponent(id, {
                unstable_setShouldSkip: setShoudSkip,
                unstable_buildConfig: buildConfig,
            });
            if (!component) {
                return [];
            }
            const element = (0, react_1.createElement)(component, id.endsWith('/layout') ? { path: pathname } : { path: pathname, searchParams }, (0, react_1.createElement)(host_1.Children));
            return [[id, element]];
        }))).flat();
        entries.push([common_1.SHOULD_SKIP_ID, Object.entries(shouldSkipObj)]);
        entries.push([common_1.LOCATION_ID, [pathname, searchParams.toString()]]);
        return Object.fromEntries(entries);
    };
    const getBuildConfig = async (unstable_collectClientModules) => {
        const pathConfig = await getMyPathConfig();
        const path2moduleIds = {};
        for (const { pathname: pathSpec } of pathConfig) {
            if (pathSpec.some(({ type }) => type !== 'literal')) {
                continue;
            }
            const pathname = '/' + pathSpec.map(({ name }) => name).join('/');
            const input = (0, common_1.getInputString)(pathname);
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
        for (const { pathname: pathSpec, isStatic, customData } of pathConfig) {
            const entries = [];
            if (pathSpec.every(({ type }) => type === 'literal')) {
                const pathname = '/' + pathSpec.map(({ name }) => name).join('/');
                const input = (0, common_1.getInputString)(pathname);
                entries.push({ input, isStatic });
            }
            buildConfig.push({
                pathname: pathSpec,
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
            return null;
        }
        const componentIds = (0, common_1.getComponentIds)(pathname);
        const input = (0, common_1.getInputString)(pathname);
        const body = (0, react_1.createElement)(client_1.ServerRouter, { route: { path: pathname, searchParams } }, componentIds.reduceRight((acc, id) => (0, react_1.createElement)(
        // @ts-expect-error
        host_1.Slot, { id, fallback: acc }, acc), null));
        return { input, body };
    };
    return { renderEntries, getBuildConfig, getSsrConfig };
}
exports.unstable_defineRouter = unstable_defineRouter;
function unstable_redirect(pathname, searchParams, skip) {
    if (skip) {
        searchParams = new URLSearchParams(searchParams);
        for (const id of skip) {
            searchParams.append(common_1.PARAM_KEY_SKIP, id);
        }
    }
    const input = (0, common_1.getInputString)(pathname);
    (0, server_1.rerender)(input, searchParams);
}
exports.unstable_redirect = unstable_redirect;
//# sourceMappingURL=defineRouter.js.map