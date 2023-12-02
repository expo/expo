"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserDefinedTopLevelNotFoundRoute = exports.getExactRoutes = exports.getRoutes = exports.assertDuplicateRoutes = exports.generateDynamic = exports.generateDynamicFromSegment = exports.getRecursiveTree = void 0;
const import_mode_1 = __importDefault(require("./import-mode"));
const matchers_1 = require("./matchers");
/** Convert a flat map of file nodes into a nested tree of files. */
function getRecursiveTree(files) {
    const tree = {
        name: '',
        children: [],
        parents: [],
        node: null,
    };
    for (const file of files) {
        // ['(tab)', 'settings', '[...another]']
        const parts = file.normalizedName.split('/');
        let currentNode = tree;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1 && part === '_layout') {
                if (currentNode.node) {
                    const overwritten = currentNode.node.contextKey;
                    throw new Error(`Higher priority Layout Route "${file.contextKey}" overriding redundant Layout Route "${overwritten}". Remove the Layout Route "${overwritten}" to fix this.`);
                }
                continue;
            }
            const existing = currentNode.children.find((item) => item.name === part);
            if (existing) {
                currentNode = existing;
            }
            else {
                const newNode = {
                    name: part,
                    children: [],
                    parents: [...currentNode.parents, currentNode.name],
                    node: null,
                };
                currentNode.children.push(newNode);
                currentNode = newNode;
            }
        }
        currentNode.node = file;
    }
    if (process.env.NODE_ENV !== 'production') {
        assertDeprecatedFormat(tree);
    }
    return tree;
}
exports.getRecursiveTree = getRecursiveTree;
function assertDeprecatedFormat(tree) {
    for (const child of tree.children) {
        if (child.node && child.children.length && !child.node.normalizedName.endsWith('_layout')) {
            const ext = child.node.contextKey.split('.').pop();
            throw new Error(`Using deprecated Layout Route format: Move \`./app/${child.node.normalizedName}.${ext}\` to \`./app/${child.node.normalizedName}/_layout.${ext}\``);
        }
        assertDeprecatedFormat(child);
    }
}
function getTreeNodesAsRouteNodes(nodes, options) {
    return nodes
        .map((node) => treeNodeToRouteNode(node, options))
        .flat()
        .filter(Boolean);
}
function generateDynamicFromSegment(name) {
    if (name === '+not-found') {
        return {
            name: '+not-found',
            deep: true,
            notFound: true,
        };
    }
    const deepDynamicName = (0, matchers_1.matchDeepDynamicRouteName)(name);
    const dynamicName = deepDynamicName ?? (0, matchers_1.matchDynamicName)(name);
    if (!dynamicName) {
        return null;
    }
    return { name: dynamicName, deep: !!deepDynamicName };
}
exports.generateDynamicFromSegment = generateDynamicFromSegment;
function generateDynamic(name) {
    const description = name
        .split('/')
        .map((segment) => generateDynamicFromSegment(segment))
        .filter(Boolean);
    return description.length === 0 ? null : description;
}
exports.generateDynamic = generateDynamic;
function collapseRouteSegments(route) {
    return (0, matchers_1.stripGroupSegmentsFromPath)(route.replace(/\/index$/, ''));
}
/**
 * Given a route node and a name representing the group name,
 * find the nearest child matching the name.
 *
 * Doesn't support slashes in the name.
 * Routes like `explore/(something)/index` will be matched against `explore`.
 *
 */
function getDefaultInitialRoute(node, name) {
    return node.children.find((node) => collapseRouteSegments(node.route) === name);
}
function applyDefaultInitialRouteName(node) {
    const groupName = (0, matchers_1.matchGroupName)(node.route);
    if (!node.children?.length) {
        return node;
    }
    // Guess at the initial route based on the group name.
    // TODO(EvanBacon): Perhaps we should attempt to warn when the group doesn't match any child routes.
    let initialRouteName = groupName ? getDefaultInitialRoute(node, groupName)?.route : undefined;
    const loaded = node.loadRoute();
    if (loaded?.unstable_settings) {
        // Allow unstable_settings={ initialRouteName: '...' } to override the default initial route name.
        initialRouteName = loaded.unstable_settings.initialRouteName ?? initialRouteName;
        if (groupName) {
            // Allow unstable_settings={ 'custom': { initialRouteName: '...' } } to override the less specific initial route name.
            const groupSpecificInitialRouteName = loaded.unstable_settings?.[groupName]?.initialRouteName;
            initialRouteName = groupSpecificInitialRouteName ?? initialRouteName;
        }
    }
    return {
        ...node,
        initialRouteName,
    };
}
function folderNodeToRouteNode({ name, children }, options) {
    // Empty folder, skip it.
    if (!children.length) {
        return null;
    }
    // When there's a directory, but no layout route file (with valid export), the child routes won't be grouped.
    // This pushes all children into the nearest layout route.
    return getTreeNodesAsRouteNodes(children.map((child) => {
        return {
            ...child,
            name: [name, child.name].filter(Boolean).join('/'),
        };
    }), options);
}
function fileNodeToRouteNode(tree, options) {
    const { name, node, children } = tree;
    if (!node)
        throw new Error('node must be defined');
    const dynamic = generateDynamic(name);
    const clones = extrapolateGroupRoutes(name, node.contextKey);
    clones.delete(name);
    const output = {
        loadRoute: node.loadRoute,
        route: name,
        contextKey: node.contextKey,
        children: getTreeNodesAsRouteNodes(children, options),
        dynamic,
        filePath: node.filePath,
        entryPoints: options.ignoreEntryPoints || isApiRoutePath(node.contextKey) ? undefined : [node.filePath],
    };
    if (clones.size) {
        return [...clones].map((clone) => applyDefaultInitialRouteName({
            ...output,
            contextKey: node.contextKey.replace(output.route, clone),
            route: clone,
        }));
    }
    return [
        applyDefaultInitialRouteName({
            loadRoute: node.loadRoute,
            route: name,
            entryPoints: options.ignoreEntryPoints || isApiRoutePath(node.contextKey) ? undefined : [node.filePath],
            filePath: node.filePath,
            contextKey: node.contextKey,
            children: getTreeNodesAsRouteNodes(children, options),
            dynamic,
        }),
    ];
}
function extrapolateGroupRoutes(route, contextKey, routes = new Set()) {
    const match = (0, matchers_1.matchGroupName)(route);
    if (!match) {
        routes.add(route);
        return routes;
    }
    const groups = match?.split(',');
    const groupsSet = new Set(groups);
    if (groupsSet.size !== groups.length) {
        throw new Error(`Array syntax cannot contain duplicate group name "${groups}" in "${contextKey}".`);
    }
    if (groups.length === 1) {
        routes.add(route);
        return routes;
    }
    for (const group of groups) {
        extrapolateGroupRoutes(route.replace(match, group.trim()), contextKey, routes);
    }
    return routes;
}
function treeNodeToRouteNode(tree, options) {
    if (tree.node) {
        return fileNodeToRouteNode(tree, options);
    }
    return folderNodeToRouteNode(tree, options);
}
function contextModuleToFileNodes(contextModule, options = {}, files = contextModule.keys()) {
    const nodes = files.map((key) => {
        // In development, check if the file exports a default component
        // this helps keep things snappy when creating files. In production we load all screens lazily.
        try {
            if (process.env.NODE_ENV === 'development') {
                // If the user has set the `EXPO_ROUTER_IMPORT_MODE` to `sync` then we should
                // filter the missing routes.
                if (import_mode_1.default === 'sync') {
                    const isApi = key.match(/\+api\.[jt]sx?$/);
                    if (!isApi && !contextModule(key)?.default) {
                        return null;
                    }
                }
            }
            const node = {
                loadRoute() {
                    if (options.ignoreRequireErrors) {
                        try {
                            return contextModule(key);
                        }
                        catch {
                            return {};
                        }
                    }
                    else {
                        return contextModule(key);
                    }
                },
                normalizedName: (0, matchers_1.getNameFromFilePath)(key),
                filePath: key,
                contextKey: key,
            };
            return node;
        }
        catch (error) {
            // Probably this won't stop metro from freaking out but it's worth a try.
            console.warn('Error loading route "' + key + '"', error);
        }
        return null;
    });
    return nodes.filter(Boolean);
}
function hasCustomRootLayoutNode(routes) {
    if (routes.length !== 1) {
        return false;
    }
    // This could either be the root _layout or an app with a single file.
    const route = routes[0];
    if (route.route === '' && route.contextKey.match(/^\.\/_layout\.([jt]sx?)$/)) {
        return true;
    }
    return false;
}
function treeNodesToRootRoute(treeNode, options) {
    const routes = treeNodeToRouteNode(treeNode, options);
    return withOptionalRootLayout(routes);
}
function processKeys(files, options) {
    const { ignore } = options;
    return files.filter((file) => {
        return !ignore?.some((pattern) => pattern.test(file));
    });
}
/**
 * Asserts if the require.context has files that share the same name but have different extensions. Exposed for testing.
 * @private
 */
function assertDuplicateRoutes(filenames) {
    if (process.env.NODE_ENV === 'production') {
        return;
    }
    const duplicates = filenames
        .map((filename) => (0, matchers_1.removeSupportedExtensions)(filename))
        .reduce((acc, filename) => {
        acc[filename] = acc[filename] ? acc[filename] + 1 : 1;
        return acc;
    }, {});
    Object.entries(duplicates).forEach(([filename, count]) => {
        if (count > 1) {
            throw new Error(`Multiple files match the route name "${filename}".`);
        }
    });
}
exports.assertDuplicateRoutes = assertDuplicateRoutes;
/** Given a Metro context module, return an array of nested routes. */
function getRoutes(contextModule, options) {
    const route = getExactRoutesInternal(contextModule, options);
    // If there is no route, return an empty route.
    if (!route) {
        return null;
    }
    appendSitemapRoute(route);
    // Auto add not found route if it doesn't exist
    appendUnmatchedRoute(route);
    if (options?.ignoreEntryPoints) {
        return removeFilePath(route);
    }
    return removeFilePath(crawlAndAppendEntryFilesForInitialRoutes(crawlAndAppendEntryFiles(route)));
}
exports.getRoutes = getRoutes;
function removeFilePath(route) {
    if (!route)
        return route;
    const { filePath, ...rest } = route;
    return {
        ...rest,
        children: route.children.map((child) => removeFilePath(child)).filter(Boolean),
    };
}
function unique(array) {
    return [...new Set(array)];
}
function isLayoutRoute(route) {
    return route.contextKey.match(/\/_layout\.([jt]sx?)$/);
}
function isViewRoute(route) {
    return !!route && !isApiRoute(route);
}
function isApiRoute(route) {
    return isApiRoutePath(route.contextKey);
}
function isApiRoutePath(route) {
    return !!route.match(/\+api\.[jt]sx?$/);
}
function crawlAndAppendEntryFiles(route, entryPoints = []) {
    if (!isViewRoute(route)) {
        return null;
    }
    const nextEntryPoints = unique([...entryPoints, ...(route.entryPoints ?? []), route.filePath]);
    route.children.forEach((child) => {
        crawlAndAppendEntryFiles(child, nextEntryPoints);
    });
    // Skip adding entry points for layout routes since we only need them
    // for rendering child nodes.
    if (isLayoutRoute(route)) {
        delete route.entryPoints;
    }
    else {
        route.entryPoints = nextEntryPoints;
    }
    return route;
}
function crawlAndAppendEntryFilesForInitialRoutes(route, initialRoutes = []) {
    if (!isViewRoute(route)) {
        return null;
    }
    // Skip adding entry points for layout routes since we only need them
    // for rendering child nodes.
    if (isLayoutRoute(route)) {
        if (route.initialRouteName) {
            const initialRoute = route.children.find((child) => child.route === route.initialRouteName);
            if (!initialRoute) {
                throw new Error(`Invalid initialRouteName "${route.initialRouteName}" defined in ${route.filePath}. Options are: ${route.children.map((route) => route.route).join(', ')}`);
            }
            // Update all children to include the entry points from the initial route...
            route.children.forEach((child) => {
                crawlAndAppendEntryFilesForInitialRoutes(child, [...initialRoutes, initialRoute]);
            });
        }
    }
    else {
        const isInitial = initialRoutes.some((initialRoute) => initialRoute.contextKey === route.contextKey);
        if (!isInitial) {
            route.entryPoints = unique([
                ...initialRoutes.map((route) => route.entryPoints ?? []).flat(),
                ...(route.entryPoints ?? []),
            ]);
        }
    }
    return route;
}
function getIgnoreList(options) {
    const ignore = [/^\.\/\+html\.[tj]sx?$/, ...(options?.ignore ?? [])];
    if (options?.preserveApiRoutes !== true) {
        ignore.push(/\+api\.[tj]sx?$/);
    }
    return ignore;
}
function getExactRoutesInternal(contextModule, options = {}) {
    const treeNodes = contextModuleToTree(contextModule, options);
    return treeNodesToRootRoute(treeNodes, options);
}
/** Get routes without unmatched or sitemap. */
function getExactRoutes(contextModule, options) {
    const route = getExactRoutesInternal(contextModule, options);
    if (!options?.ignoreEntryPoints) {
        return removeFilePath(crawlAndAppendEntryFilesForInitialRoutes(crawlAndAppendEntryFiles(route)));
    }
    return removeFilePath(route);
}
exports.getExactRoutes = getExactRoutes;
function contextModuleToTree(contextModule, options) {
    const allowed = processKeys(contextModule.keys(), {
        ...options,
        ignore: getIgnoreList(options),
    });
    assertDuplicateRoutes(allowed);
    const files = contextModuleToFileNodes(contextModule, options, allowed);
    return getRecursiveTree(files);
}
function appendSitemapRoute(routes) {
    if (!routes.children.length ||
        // Allow overriding the sitemap route
        routes.children.some((route) => route.route === '_sitemap')) {
        return routes;
    }
    routes.children.push({
        loadRoute() {
            const { Sitemap, getNavOptions } = require('./views/Sitemap');
            return { default: Sitemap, getNavOptions };
        },
        filePath: 'expo-router/build/views/Sitemap.js',
        route: '_sitemap',
        contextKey: './_sitemap.tsx',
        generated: true,
        internal: true,
        dynamic: null,
        children: [],
    });
    return routes;
}
function appendUnmatchedRoute(routes) {
    // Auto add not found route if it doesn't exist
    const userDefinedDynamicRoute = getUserDefinedTopLevelNotFoundRoute(routes);
    if (!userDefinedDynamicRoute) {
        routes.children.push({
            loadRoute() {
                return { default: require('./views/Unmatched').Unmatched };
            },
            filePath: 'expo-router/build/views/Unmatched.js',
            route: '+not-found',
            contextKey: './+not-found.tsx',
            dynamic: [{ name: '+not-found', deep: true, notFound: true }],
            children: [],
            generated: true,
            internal: true,
        });
    }
    return routes;
}
/**
 * Exposed for testing.
 * @returns a top-level deep dynamic route if it exists, otherwise null.
 */
function getUserDefinedTopLevelNotFoundRoute(routes) {
    // Auto add not found route if it doesn't exist
    for (const route of routes?.children ?? []) {
        if (route.generated)
            continue;
        const isDeepDynamic = (0, matchers_1.stripGroupSegmentsFromPath)(route.route) === '+not-found' && route.route.match(/\+not-found$/);
        if (isDeepDynamic) {
            return route;
        }
        // Recurse through group routes
        if ((0, matchers_1.matchGroupName)(route.route)) {
            const child = getUserDefinedTopLevelNotFoundRoute(route);
            if (child) {
                return child;
            }
        }
    }
    return null;
}
exports.getUserDefinedTopLevelNotFoundRoute = getUserDefinedTopLevelNotFoundRoute;
function withOptionalRootLayout(routes) {
    if (!routes?.length) {
        return null;
    }
    if (hasCustomRootLayoutNode(routes)) {
        return routes[0];
    }
    return {
        loadRoute: () => ({
            default: require('./views/Navigator')
                .DefaultNavigator,
        }),
        filePath: 'expo-router/build/views/Navigator.js',
        // Generate a fake file name for the directory
        contextKey: './_layout.tsx',
        route: '',
        generated: true,
        dynamic: null,
        children: routes,
    };
}
//# sourceMappingURL=getRoutes.js.map