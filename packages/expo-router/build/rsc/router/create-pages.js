"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPages = void 0;
const react_1 = require("react");
const defineRouter_1 = require("./defineRouter");
const path_1 = require("../path");
const hasPathSpecPrefix = (prefix, path) => {
    for (let i = 0; i < prefix.length; i++) {
        if (i >= path.length ||
            prefix[i].type !== path[i].type ||
            prefix[i].name !== path[i].name) {
            return false;
        }
    }
    return true;
};
function createPages(fn) {
    let configured = false;
    // TODO I think there's room for improvement to refactor these structures
    const staticPathSet = new Set();
    const dynamicPagePathMap = new Map();
    const wildcardPagePathMap = new Map();
    const dynamicLayoutPathMap = new Map();
    const staticComponentMap = new Map();
    const noSsrSet = new WeakSet();
    const buildDataMap = new Map();
    const registerStaticComponent = (id, component) => {
        if (staticComponentMap.has(id) && staticComponentMap.get(id) !== component) {
            throw new Error(`Duplicated component for: ${id}`);
        }
        staticComponentMap.set(id, component);
    };
    const createPage = (page) => {
        if (configured) {
            throw new Error('no longer available');
        }
        const pathSpec = (0, path_1.parsePathWithSlug)(page.path);
        if (page.unstable_disableSSR) {
            noSsrSet.add(pathSpec);
        }
        const numSlugs = pathSpec.filter(({ type }) => type !== 'literal').length;
        const numWildcards = pathSpec.filter(({ type }) => type === 'wildcard').length;
        if (page.render === 'static' && numSlugs === 0) {
            staticPathSet.add([page.path, pathSpec]);
            const id = (0, path_1.joinPath)(page.path, 'page').replace(/^\//, '');
            registerStaticComponent(id, page.component);
        }
        else if (page.render === 'static' && numSlugs > 0 && numWildcards === 0) {
            const staticPaths = page.staticPaths.map((item) => (Array.isArray(item) ? item : [item]));
            for (const staticPath of staticPaths) {
                if (staticPath.length !== numSlugs) {
                    throw new Error('staticPaths does not match with slug pattern');
                }
                const mapping = {};
                let slugIndex = 0;
                const pathItems = pathSpec.map(({ type, name }) => {
                    if (type !== 'literal') {
                        const actualName = staticPath[slugIndex++];
                        if (name) {
                            mapping[name] = actualName;
                        }
                        return actualName;
                    }
                    return name;
                });
                staticPathSet.add([page.path, pathItems.map((name) => ({ type: 'literal', name }))]);
                const id = (0, path_1.joinPath)(...pathItems, 'page');
                const WrappedComponent = (props) => (0, react_1.createElement)(page.component, { ...props, ...mapping });
                registerStaticComponent(id, WrappedComponent);
            }
        }
        else if (page.render === 'dynamic' && numWildcards === 0) {
            if (dynamicPagePathMap.has(page.path)) {
                throw new Error(`Duplicated dynamic path: ${page.path}`);
            }
            dynamicPagePathMap.set(page.path, [pathSpec, page.component]);
        }
        else if (page.render === 'dynamic' && numWildcards === 1) {
            if (wildcardPagePathMap.has(page.path)) {
                throw new Error(`Duplicated dynamic path: ${page.path}`);
            }
            wildcardPagePathMap.set(page.path, [pathSpec, page.component]);
        }
        else {
            throw new Error('Invalid page configuration');
        }
    };
    const createLayout = (layout) => {
        if (configured) {
            throw new Error('no longer available');
        }
        if (layout.render === 'static') {
            const id = (0, path_1.joinPath)(layout.path, 'layout').replace(/^\//, '');
            registerStaticComponent(id, layout.component);
        }
        else if (layout.render === 'dynamic') {
            if (dynamicLayoutPathMap.has(layout.path)) {
                throw new Error(`Duplicated dynamic path: ${layout.path}`);
            }
            const pathSpec = (0, path_1.parsePathWithSlug)(layout.path);
            dynamicLayoutPathMap.set(layout.path, [pathSpec, layout.component]);
        }
        else {
            throw new Error('Invalid layout configuration');
        }
    };
    const unstable_setBuildData = (path, data) => {
        buildDataMap.set(path, data);
    };
    let ready;
    const configure = async (buildConfig) => {
        if (!configured && !ready) {
            ready = fn({ createPage, createLayout, unstable_setBuildData }, { unstable_buildConfig: buildConfig });
            await ready;
            configured = true;
        }
        await ready;
    };
    return (0, defineRouter_1.unstable_defineRouter)(async () => {
        await configure();
        const paths = [];
        for (const [path, pathSpec] of staticPathSet) {
            const noSsr = noSsrSet.has(pathSpec);
            const isStatic = Array.from(dynamicLayoutPathMap.values()).every(([layoutPathSpec]) => !hasPathSpecPrefix(layoutPathSpec, pathSpec));
            paths.push({
                path: pathSpec,
                isStatic,
                noSsr,
                data: buildDataMap.get(path),
            });
        }
        for (const [path, [pathSpec]] of dynamicPagePathMap) {
            const noSsr = noSsrSet.has(pathSpec);
            paths.push({
                path: pathSpec,
                isStatic: false,
                noSsr,
                data: buildDataMap.get(path),
            });
        }
        for (const [path, [pathSpec]] of wildcardPagePathMap) {
            const noSsr = noSsrSet.has(pathSpec);
            paths.push({
                path: pathSpec,
                isStatic: false,
                noSsr,
                data: buildDataMap.get(path),
            });
        }
        return paths;
    }, async (id, { unstable_setShouldSkip, unstable_buildConfig }) => {
        await configure(unstable_buildConfig);
        const staticComponent = staticComponentMap.get(id);
        if (staticComponent) {
            unstable_setShouldSkip([]);
            return staticComponent;
        }
        for (const [pathSpec, Component] of dynamicPagePathMap.values()) {
            const mapping = (0, path_1.getPathMapping)([...pathSpec, { type: 'literal', name: 'page' }], id);
            if (mapping) {
                if (Object.keys(mapping).length === 0) {
                    unstable_setShouldSkip();
                    return Component;
                }
                const WrappedComponent = (props) => (0, react_1.createElement)(Component, { ...props, ...mapping });
                unstable_setShouldSkip();
                return WrappedComponent;
            }
        }
        for (const [pathSpec, Component] of wildcardPagePathMap.values()) {
            const mapping = (0, path_1.getPathMapping)([...pathSpec, { type: 'literal', name: 'page' }], id);
            if (mapping) {
                const WrappedComponent = (props) => (0, react_1.createElement)(Component, { ...props, ...mapping });
                unstable_setShouldSkip();
                return WrappedComponent;
            }
        }
        for (const [pathSpec, Component] of dynamicLayoutPathMap.values()) {
            const mapping = (0, path_1.getPathMapping)([...pathSpec, { type: 'literal', name: 'layout' }], id);
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
    });
}
exports.createPages = createPages;
//# sourceMappingURL=create-pages.js.map