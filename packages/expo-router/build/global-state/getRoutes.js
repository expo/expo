"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoutes = void 0;
const react_native_1 = require("react-native");
const matchers_1 = require("../matchers");
const validPlatforms = new Set(['android', 'ios', 'windows', 'osx', 'native', 'web']);
/** Given a Metro context module, return an array of nested routes. */
function getRoutes(contextModule, options = {}) {
    const directoryTree = getDirectoryTree(contextModule, options);
    // If there is no route, return an empty route.
    if (directoryTree.views.size === 0 && directoryTree.subdirectories.size === 0) {
        return null;
    }
    // There will always be a root layout
    const routeNode = directoryTree.layout;
    hoistDirectoryTree(directoryTree, routeNode, options);
    return routeNode;
}
exports.getRoutes = getRoutes;
function getDirectoryTree(contextModule, options) {
    const ignoreList = getIgnoreList(options);
    const directory = {
        views: new Map(),
        subdirectories: new Map(),
    };
    for (const filePath of contextModule.keys()) {
        if (ignoreList.some((regex) => regex.test(filePath))) {
            continue;
        }
        const meta = getFileMeta(filePath, options);
        const leaves = [];
        for (const key of extrapolateGroups(filePath)) {
            let node = directory;
            for (const part of key.split('/').slice(0, -1)) {
                let child = node.subdirectories.get(part);
                if (!child) {
                    child = {
                        views: new Map(),
                        subdirectories: new Map(),
                    };
                    node.subdirectories.set(part, child);
                }
                node = child;
            }
            leaves.push(node);
        }
        const node = {
            loadRoute() {
                if (options.ignoreRequireErrors) {
                    try {
                        return contextModule(filePath);
                    }
                    catch {
                        return {};
                    }
                }
                else {
                    return contextModule(filePath);
                }
            },
            contextKey: filePath,
            route: meta.filename,
            generated: true,
            dynamic: meta.dynamic,
            children: [],
        };
        if (meta.isLayout) {
            for (const leaf of leaves) {
                if (leaf.layout && leaf.layout !== node) {
                    throw new Error(`The layouts "${filePath}" and ${leaf.layout.contextKey} conflict in "${meta.dirname}. Please remove one of these files.`);
                }
                else {
                    leaf.layout = node;
                }
            }
        }
        else if (meta.isApi) {
            for (const leaf of leaves) {
                const existing = leaf.views.get(meta.filepathWithoutExtensions);
                if (existing) {
                    throw new Error(`The API routes "${filePath}" and ${existing[0].contextKey} conflict in "${meta.dirname}. Please remove one of these files.`);
                }
                else {
                    leaf.layout = node;
                }
                leaf.views.set(meta.filepathWithoutExtensions, [node]);
            }
        }
        else {
            for (const leaf of leaves) {
                let nodes = leaf.views.get(meta.filename);
                if (!nodes) {
                    nodes = [];
                    leaf.views.set(meta.filepathWithoutExtensions, nodes);
                }
                const existing = nodes[meta.specificity];
                if (existing) {
                    throw new Error(`The routes "${filePath}" and ${existing.contextKey} conflict in "${meta.dirname}. Please remove one of these files.`);
                }
                else {
                    nodes[meta.specificity] = node;
                }
            }
        }
    }
    return directory;
}
function hoistDirectoryTree(directory, parent, options, entryPoints = []) {
    if (directory.layout) {
        parent = {
            ...directory.layout,
            children: [],
        };
        entryPoints.push(directory.layout.contextKey);
    }
    for (const routes of directory.views.values()) {
        const route = getMostSpecificRoute(routes);
        parent.children.push({
            ...route,
            entryPoints: [...entryPoints, route.contextKey],
        });
    }
    for (const child of directory.subdirectories.values()) {
        hoistDirectoryTree(child, parent, options, entryPoints);
    }
}
function getMostSpecificRoute(routes) {
    const route = routes[routes.length - 1];
    if (!routes[0]) {
        throw new Error(`${route.contextKey} does not contain a fallback platform route`);
    }
    return routes[routes.length - 1];
}
function getFileMeta(key, options) {
    const parts = key.split('/');
    const dirnameParts = parts.slice(0, -1);
    const dirname = dirnameParts.join('/');
    const filename = parts[parts.length - 1];
    const filenameParts = filename.split('.');
    let platform;
    if (options.platformExtensions) {
        if (filenameParts.length > 2) {
            const possiblePlatform = filenameParts[filenameParts.length - 2];
            if (validPlatforms.has(possiblePlatform)) {
                platform = possiblePlatform;
            }
        }
    }
    else {
        if (filenameParts.length > 2) {
            const possiblePlatform = filenameParts[filenameParts.length - 2];
            if (validPlatforms.has(possiblePlatform)) {
                throw new Error('invalid route with platform extension');
            }
        }
    }
    const filepathWithoutExtensions = (0, matchers_1.removeSupportedExtensions)(key);
    let dynamic = parts
        .map((part) => {
        if (part === '+not-found') {
            return {
                name: '+not-found',
                deep: true,
                notFound: true,
            };
        }
        const deepDynamicName = (0, matchers_1.matchDeepDynamicRouteName)(part);
        const dynamicName = deepDynamicName ?? (0, matchers_1.matchDynamicName)(part);
        if (!dynamicName)
            return null;
        return { name: dynamicName, deep: !!deepDynamicName };
    })
        .filter((part) => !!part);
    if (dynamic.length === 0)
        dynamic = null;
    const isLayout = filepathWithoutExtensions.endsWith('_layout.tsx');
    const isApi = key.match(/\+api\.[jt]sx?$/);
    let specificity = 0;
    if (platform) {
        if (platform === react_native_1.Platform.OS) {
            specificity = 2;
        }
        else if (platform === 'native' && react_native_1.Platform.OS !== 'web') {
            specificity = 1;
        }
    }
    return {
        key,
        specificity,
        parts,
        dirnameParts,
        dirname,
        filename,
        dynamic,
        isLayout,
        isApi,
        filepathWithoutExtensions,
    };
}
function getIgnoreList(options) {
    const ignore = [/^\.\/\+html\.[tj]sx?$/, ...(options?.ignore ?? [])];
    if (options?.preserveApiRoutes !== true) {
        ignore.push(/\+api\.[tj]sx?$/);
    }
    return ignore;
}
function extrapolateGroups(key, keys = new Set()) {
    const match = (0, matchers_1.matchGroupName)(key);
    if (!match) {
        keys.add(key);
        return keys;
    }
    const groups = match?.split(',');
    const groupsSet = new Set(groups);
    if (groupsSet.size !== groups.length) {
        throw new Error(`Array syntax cannot contain duplicate group name "${groups}" in "${key}".`);
    }
    if (groups.length === 1) {
        keys.add(key);
        return keys;
    }
    for (const group of groups) {
        extrapolateGroups(key.replace(match, group.trim()), keys);
    }
    return keys;
}
//# sourceMappingURL=getRoutes.js.map