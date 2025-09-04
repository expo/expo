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
exports.createPages = createPages;
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
const sanitizeSlug = (slug) => slug.replace(/\./g, '').replace(/ /g, '-');
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
            const id = (0, path_1.joinPath)(page.path, 'page').replace(/^\//, '');
            registerStaticComponent(id, page.component);
        }
        else if (page.render === 'static' && numSlugs > 0 && 'staticPaths' in page) {
            const staticPaths = page.staticPaths.map((item) => (Array.isArray(item) ? item : [item]).map(sanitizeSlug));
            for (const staticPath of staticPaths) {
                if (staticPath.length !== numSlugs && numWildcards === 0) {
                    throw new Error('staticPaths does not match with slug pattern');
                }
                const mapping = {};
                let slugIndex = 0;
                const pathItems = [];
                pathSpec.forEach(({ type, name }) => {
                    switch (type) {
                        case 'literal':
                            pathItems.push(name);
                            break;
                        case 'wildcard':
                            mapping[name] = staticPath.slice(slugIndex);
                            staticPath.slice(slugIndex++).forEach((slug) => {
                                pathItems.push(slug);
                            });
                            break;
                        case 'group':
                            pathItems.push(staticPath[slugIndex++]);
                            mapping[name] = pathItems[pathItems.length - 1];
                            break;
                    }
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
            throw new Error('Invalid page configuration: ' + page.path);
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
            const isStatic = (() => {
                for (const [_, [layoutPathSpec]] of dynamicLayoutPathMap) {
                    if (hasPathSpecPrefix(layoutPathSpec, pathSpec)) {
                        return false;
                    }
                }
                return true;
            })();
            paths.push({
                pattern: (0, path_1.path2regexp)((0, path_1.parsePathWithSlug)(path)),
                path: pathSpec,
                isStatic,
                noSsr,
                data: buildDataMap.get(path),
            });
        }
        for (const [path, [pathSpec]] of dynamicPagePathMap) {
            const noSsr = noSsrSet.has(pathSpec);
            paths.push({
                pattern: (0, path_1.path2regexp)((0, path_1.parsePathWithSlug)(path)),
                path: pathSpec,
                isStatic: false,
                noSsr,
                data: buildDataMap.get(path),
            });
        }
        for (const [path, [pathSpec]] of wildcardPagePathMap) {
            const noSsr = noSsrSet.has(pathSpec);
            paths.push({
                pattern: (0, path_1.path2regexp)((0, path_1.parsePathWithSlug)(path)),
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
        for (const [_, [pathSpec, Component]] of dynamicPagePathMap) {
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
        for (const [_, [pathSpec, Component]] of wildcardPagePathMap) {
            const mapping = (0, path_1.getPathMapping)([...pathSpec, { type: 'literal', name: 'page' }], id);
            if (mapping) {
                const WrappedComponent = (props) => (0, react_1.createElement)(Component, { ...props, ...mapping });
                unstable_setShouldSkip();
                return WrappedComponent;
            }
        }
        for (const [_, [pathSpec, Component]] of dynamicLayoutPathMap) {
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
//# sourceMappingURL=create-pages.js.map