"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDynamic = exports.extrapolateGroups = exports.getIgnoreList = exports.getRoutes = void 0;
const matchers_1 = require("./matchers");
const validPlatforms = new Set(['android', 'ios', 'native', 'web']);
/**
 * Given a Metro context module, return an array of nested routes.
 *
 * This is a two step process:
 *  1. Convert the RequireContext keys (file paths) into a directory tree.
 *      - This should extrapolate array syntax into multiple routes
 *      - Routes are given a specificity score
 *  2. Flatten the directory tree into routes
 *      - Routes in directories without _layout files are hoisted to the nearest _layout
 *      - The name of the route is relative to the nearest _layout
 *      - If multiple routes have the same name, the most specific route is used
 */
function getRoutes(contextModule, options) {
    const directoryTree = getDirectoryTree(contextModule, options);
    // If there are no routes
    if (!directoryTree) {
        return null;
    }
    const rootNode = flattenDirectoryTreeToRoutes(directoryTree, options);
    if (!options.ignoreEntryPoints) {
        crawlAndAppendInitialRoutesAndEntryFiles(rootNode, options);
    }
    return rootNode;
}
exports.getRoutes = getRoutes;
/**
 * Converts the RequireContext keys (file paths) into a directory tree.
 */
function getDirectoryTree(contextModule, options) {
    const importMode = options.importMode || process.env.EXPO_ROUTER_IMPORT_MODE;
    const ignoreList = [/^\.\/\+(html|native-intent)\.[tj]sx?$/]; // Ignore the top level ./+html file
    if (options.ignore) {
        ignoreList.push(...options.ignore);
    }
    if (!options.preserveApiRoutes) {
        ignoreList.push(/\+api\.[tj]sx?$/);
    }
    const rootDirectory = {
        files: new Map(),
        subdirectories: new Map(),
    };
    let hasRoutes = false;
    let isValid = false;
    for (const filePath of contextModule.keys()) {
        if (ignoreList.some((regex) => regex.test(filePath))) {
            continue;
        }
        isValid = true;
        const meta = getFileMeta(filePath, options);
        // This is a file that should be ignored. e.g maybe it has an invalid platform?
        if (meta.specificity < 0) {
            continue;
        }
        let node = {
            type: meta.isApi ? 'api' : meta.isLayout ? 'layout' : 'route',
            loadRoute() {
                let routeModule;
                if (options.ignoreRequireErrors) {
                    try {
                        routeModule = contextModule(filePath);
                    }
                    catch {
                        routeModule = {};
                    }
                }
                else {
                    routeModule = contextModule(filePath);
                }
                if (process.env.NODE_ENV === 'development' && importMode === 'sync') {
                    // In development mode, when async routes are disabled, add some extra error handling to improve the developer experience.
                    // This can be useful when you accidentally use an async function in a route file for the default export.
                    if (routeModule instanceof Promise) {
                        throw new Error(`Route "${filePath}" cannot be a promise when async routes is disabled.`);
                    }
                    const defaultExport = routeModule?.default;
                    if (defaultExport instanceof Promise) {
                        throw new Error(`The default export from route "${filePath}" is a promise. Ensure the React Component does not use async or promises.`);
                    }
                    // check if default is an async function without invoking it
                    if (defaultExport instanceof Function &&
                        // This only works on web because Hermes support async functions so we have to transform them out.
                        defaultExport.constructor.name === 'AsyncFunction') {
                        throw new Error(`The default export from route "${filePath}" is an async function. Ensure the React Component does not use async or promises.`);
                    }
                }
                return routeModule;
            },
            contextKey: filePath,
            route: '',
            dynamic: null,
            children: [], // While we are building the directory tree, we don't know the node's children just yet. This is added during hoisting
        };
        if (process.env.NODE_ENV === 'development') {
            // If the user has set the `EXPO_ROUTER_IMPORT_MODE` to `sync` then we should
            // filter the missing routes.
            if (node.type !== 'api' && importMode === 'sync') {
                const routeItem = node.loadRoute();
                // Have a warning for nullish ex
                const route = routeItem?.default;
                if (route == null) {
                    // Do not throw an error since a user may just be creating a new route.
                    console.warn(`Route "${filePath}" is missing the required default export. Ensure a React component is exported as default.`);
                    continue;
                }
                if (['boolean', 'number', 'string'].includes(typeof route)) {
                    throw new Error(`The default export from route "${filePath}" is an unsupported type: "${typeof route}". Only React Components are supported as default exports from route files.`);
                }
            }
        }
        /**
         * A single filepath may be extrapolated into multiple routes if it contains array syntax.
         * Another way to thinking about is that a filepath node is present in multiple leaves of the directory tree.
         */
        for (const route of extrapolateGroups(meta.route)) {
            // Traverse the directory tree to its leaf node, creating any missing directories along the way
            const subdirectoryParts = route.split('/').slice(0, -1);
            // Start at the root directory and traverse the path to the leaf directory
            let directory = rootDirectory;
            for (const part of subdirectoryParts) {
                let subDirectory = directory.subdirectories.get(part);
                // Create any missing subdirectories
                if (!subDirectory) {
                    subDirectory = {
                        files: new Map(),
                        subdirectories: new Map(),
                    };
                    directory.subdirectories.set(part, subDirectory);
                }
                directory = subDirectory;
            }
            // Clone the node for this route
            node = { ...node, route };
            if (meta.isLayout) {
                directory.layout ??= [];
                const existing = directory.layout[meta.specificity];
                if (existing) {
                    // In production, use the first route found
                    if (process.env.NODE_ENV !== 'production') {
                        throw new Error(`The layouts "${filePath}" and "${existing.contextKey}" conflict on the route "/${route}". Please remove or rename one of these files.`);
                    }
                }
                else {
                    node = getLayoutNode(node, options);
                    directory.layout[meta.specificity] = node;
                }
            }
            else if (meta.isApi) {
                const fileKey = `${route}+api`;
                let nodes = directory.files.get(fileKey);
                if (!nodes) {
                    nodes = [];
                    directory.files.set(fileKey, nodes);
                }
                // API Routes have no specificity, they are always the first node
                const existing = nodes[0];
                if (existing) {
                    // In production, use the first route found
                    if (process.env.NODE_ENV !== 'production') {
                        throw new Error(`The API route file "${filePath}" and "${existing.contextKey}" conflict on the route "/${route}". Please remove or rename one of these files.`);
                    }
                }
                else {
                    nodes[0] = node;
                }
            }
            else {
                let nodes = directory.files.get(route);
                if (!nodes) {
                    nodes = [];
                    directory.files.set(route, nodes);
                }
                /**
                 * If there is an existing node with the same specificity, then we have a conflict.
                 * NOTE(Platform Routes):
                 *    We cannot check for specificity conflicts here, as we haven't processed all the context keys yet!
                 *    This will be checked during hoisting, as well as enforcing that all routes have a non-platform route.
                 */
                const existing = nodes[meta.specificity];
                if (existing) {
                    // In production, use the first route found
                    if (process.env.NODE_ENV !== 'production') {
                        throw new Error(`The route files "${filePath}" and "${existing.contextKey}" conflict on the route "/${route}". Please remove or rename one of these files.`);
                    }
                }
                else {
                    hasRoutes ||= true;
                    nodes[meta.specificity] = node;
                }
            }
        }
    }
    // If there are no routes/layouts then we should display the tutorial.
    if (!isValid) {
        return null;
    }
    /**
     * If there are no top-level _layout, add a default _layout
     * While this is a generated route, it will still be generated even if skipGenerated is true.
     */
    if (!rootDirectory.layout) {
        rootDirectory.layout = [
            options.getSystemRoute({
                type: 'layout',
                route: '',
            }),
        ];
    }
    // Only include the sitemap if there are routes.
    if (!options.skipGenerated) {
        if (hasRoutes && options.sitemap !== false) {
            appendSitemapRoute(rootDirectory, options);
        }
        if (options.notFound !== false) {
            appendNotFoundRoute(rootDirectory, options);
        }
    }
    return rootDirectory;
}
/**
 * Flatten the directory tree into routes, hoisting routes to the nearest _layout.
 */
function flattenDirectoryTreeToRoutes(directory, options, 
/* The nearest _layout file in the directory tree */
layout, 
/* Route names are relative to their layout */
pathToRemove = '') {
    /**
     * This directory has a _layout file so it becomes the new target for hoisting routes.
     */
    if (directory.layout) {
        const previousLayout = layout;
        layout = getMostSpecific(directory.layout);
        // Add the new layout as a child of its parent
        if (previousLayout) {
            previousLayout.children.push(layout);
        }
        if (options.internal_stripLoadRoute) {
            delete layout.loadRoute;
        }
        // `route` is the absolute pathname. We need to make this relative to the last _layout
        const newRoute = layout.route.replace(pathToRemove, '');
        pathToRemove = layout.route ? `${layout.route}/` : '';
        // Now update this layout with the new relative route and dynamic conventions
        layout.route = newRoute;
        layout.dynamic = generateDynamic(layout.contextKey.slice(0));
    }
    // This should never occur as there will always be a root layout, but it makes the type system happy
    if (!layout)
        throw new Error('Expo Router Internal Error: No nearest layout');
    for (const routes of directory.files.values()) {
        const routeNode = getMostSpecific(routes);
        // `route` is the absolute pathname. We need to make this relative to the nearest layout
        routeNode.route = routeNode.route.replace(pathToRemove, '');
        routeNode.dynamic = generateDynamic(routeNode.route);
        if (options.internal_stripLoadRoute) {
            delete routeNode.loadRoute;
        }
        layout.children.push(routeNode);
    }
    // Recursively flatten the subdirectories
    for (const child of directory.subdirectories.values()) {
        flattenDirectoryTreeToRoutes(child, options, layout, pathToRemove);
    }
    return layout;
}
function getFileMeta(key, options) {
    // Remove the leading `./`
    key = key.replace(/^\.\//, '');
    const parts = key.split('/');
    let route = (0, matchers_1.removeSupportedExtensions)(key);
    const filename = parts[parts.length - 1];
    const [filenameWithoutExtensions, platformExtension] = (0, matchers_1.removeSupportedExtensions)(filename).split('.');
    const isLayout = filenameWithoutExtensions === '_layout';
    const isApi = filename.match(/\+api\.(\w+\.)?[jt]sx?$/);
    if (filenameWithoutExtensions.startsWith('(') && filenameWithoutExtensions.endsWith(')')) {
        throw new Error(`Invalid route ./${key}. Routes cannot end with '(group)' syntax`);
    }
    // Nested routes cannot start with the '+' character, except for the '+not-found' route
    if (!isApi && filename.startsWith('+') && filenameWithoutExtensions !== '+not-found') {
        const renamedRoute = [...parts.slice(0, -1), filename.slice(1)].join('/');
        throw new Error(`Invalid route ./${key}. Route nodes cannot start with the '+' character. "Please rename to ${renamedRoute}"`);
    }
    let specificity = 0;
    const hasPlatformExtension = validPlatforms.has(platformExtension);
    const usePlatformRoutes = options.platformRoutes ?? true;
    if (hasPlatformExtension) {
        if (!usePlatformRoutes) {
            // If the user has disabled platform routes, then we should ignore this file
            specificity = -1;
        }
        else if (!options.platform) {
            // If we don't have a platform, then we should ignore this file
            // This used by typed routes, sitemap, etc
            specificity = -1;
        }
        else if (platformExtension === options.platform) {
            // If the platform extension is the same as the options.platform, then it is the most specific
            specificity = 2;
        }
        else if (platformExtension === 'native' && options.platform !== 'web') {
            // `native` is allow but isn't as specific as the platform
            specificity = 1;
        }
        else if (platformExtension !== options.platform) {
            // Somehow we have a platform extension that doesn't match the options.platform and it isn't native
            // This is an invalid file and we will ignore it
            specificity = -1;
        }
        if (isApi && specificity !== 0) {
            throw new Error(`Api routes cannot have platform extensions. Please remove '.${platformExtension}' from './${key}'`);
        }
        route = route.replace(new RegExp(`.${platformExtension}$`), '');
    }
    return {
        route,
        specificity,
        isLayout,
        isApi,
    };
}
function getIgnoreList(options) {
    const ignore = [/^\.\/\+html\.[tj]sx?$/, ...(options?.ignore ?? [])];
    if (options?.preserveApiRoutes !== true) {
        ignore.push(/\+api\.[tj]sx?$/);
    }
    return ignore;
}
exports.getIgnoreList = getIgnoreList;
/**
 * Generates a set of strings which have the router array syntax extrapolated.
 *
 * /(a,b)/(c,d)/e.tsx => new Set(['a/c/e.tsx', 'a/d/e.tsx', 'b/c/e.tsx', 'b/d/e.tsx'])
 */
function extrapolateGroups(key, keys = new Set()) {
    const match = (0, matchers_1.matchArrayGroupName)(key);
    if (!match) {
        keys.add(key);
        return keys;
    }
    const groups = match.split(',');
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
exports.extrapolateGroups = extrapolateGroups;
function generateDynamic(path) {
    const dynamic = path
        .split('/')
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
    return dynamic.length === 0 ? null : dynamic;
}
exports.generateDynamic = generateDynamic;
function appendSitemapRoute(directory, options) {
    if (!directory.files.has('_sitemap') && options.getSystemRoute) {
        directory.files.set('_sitemap', [
            options.getSystemRoute({
                type: 'route',
                route: '_sitemap',
            }),
        ]);
    }
}
function appendNotFoundRoute(directory, options) {
    if (!directory.files.has('+not-found') && options.getSystemRoute) {
        directory.files.set('+not-found', [
            options.getSystemRoute({
                type: 'route',
                route: '+not-found',
            }),
        ]);
    }
}
function getLayoutNode(node, options) {
    /**
     * A file called `(a,b)/(c)/_layout.tsx` will generate two _layout routes: `(a)/(c)/_layout` and `(b)/(c)/_layout`.
     * Each of these layouts will have a different initialRouteName based upon the first group name.
     */
    // We may strip loadRoute during testing
    const groupName = (0, matchers_1.matchLastGroupName)(node.route);
    const childMatchingGroup = node.children.find((child) => {
        return child.route.replace(/\/index$/, '') === groupName;
    });
    let initialRouteName = childMatchingGroup?.route;
    const loaded = node.loadRoute();
    if (loaded?.unstable_settings) {
        try {
            // Allow unstable_settings={ initialRouteName: '...' } to override the default initial route name.
            initialRouteName = loaded.unstable_settings.initialRouteName ?? initialRouteName;
        }
        catch (error) {
            if (error instanceof Error) {
                if (!error.message.match(/You cannot dot into a client module/)) {
                    throw error;
                }
            }
        }
        if (groupName) {
            // Allow unstable_settings={ 'custom': { initialRouteName: '...' } } to override the less specific initial route name.
            const groupSpecificInitialRouteName = loaded.unstable_settings?.[groupName]?.initialRouteName;
            initialRouteName = groupSpecificInitialRouteName ?? initialRouteName;
        }
    }
    return {
        ...node,
        route: node.route.replace(/\/?_layout$/, ''),
        children: [],
        initialRouteName,
    };
}
function crawlAndAppendInitialRoutesAndEntryFiles(node, options, entryPoints = []) {
    if (node.type === 'route') {
        node.entryPoints = [...new Set([...entryPoints, node.contextKey])];
    }
    else if (node.type === 'layout') {
        if (!node.children) {
            throw new Error(`Layout "${node.contextKey}" does not contain any child routes`);
        }
        // Every node below this layout will have it as an entryPoint
        entryPoints = [...entryPoints, node.contextKey];
        /**
         * Calculate the initialRouteNode
         *
         * A file called `(a,b)/(c)/_layout.tsx` will generate two _layout routes: `(a)/(c)/_layout` and `(b)/(c)/_layout`.
         * Each of these layouts will have a different initialRouteName based upon the first group.
         */
        const groupName = (0, matchers_1.matchGroupName)(node.route);
        const childMatchingGroup = node.children.find((child) => {
            return child.route.replace(/\/index$/, '') === groupName;
        });
        let initialRouteName = childMatchingGroup?.route;
        // We may strip loadRoute during testing
        if (!options.internal_stripLoadRoute) {
            const loaded = node.loadRoute();
            if (loaded?.unstable_settings) {
                try {
                    // Allow unstable_settings={ initialRouteName: '...' } to override the default initial route name.
                    initialRouteName = loaded.unstable_settings.initialRouteName ?? initialRouteName;
                }
                catch (error) {
                    if (error instanceof Error) {
                        if (!error.message.match(/You cannot dot into a client module/)) {
                            throw error;
                        }
                    }
                }
                if (groupName) {
                    // Allow unstable_settings={ 'custom': { initialRouteName: '...' } } to override the less specific initial route name.
                    const groupSpecificInitialRouteName = loaded.unstable_settings?.[groupName]?.initialRouteName;
                    initialRouteName = groupSpecificInitialRouteName ?? initialRouteName;
                }
            }
        }
        if (initialRouteName) {
            const initialRoute = node.children.find((child) => child.route === initialRouteName);
            if (!initialRoute) {
                const validInitialRoutes = node.children
                    .filter((child) => !child.generated)
                    .map((child) => `'${child.route}'`)
                    .join(', ');
                if (groupName) {
                    throw new Error(`Layout ${node.contextKey} has invalid initialRouteName '${initialRouteName}' for group '(${groupName})'. Valid options are: ${validInitialRoutes}`);
                }
                else {
                    throw new Error(`Layout ${node.contextKey} has invalid initialRouteName '${initialRouteName}'. Valid options are: ${validInitialRoutes}`);
                }
            }
            // Navigators can add initialsRoutes into the history, so they need to be to be included in the entryPoints
            node.initialRouteName = initialRouteName;
            entryPoints.push(initialRoute.contextKey);
        }
        for (const child of node.children) {
            crawlAndAppendInitialRoutesAndEntryFiles(child, options, entryPoints);
        }
    }
}
function getMostSpecific(routes) {
    const route = routes[routes.length - 1];
    if (!routes[0]) {
        throw new Error(`The file ${route.contextKey} does not have a fallback sibling file without a platform extension.`);
    }
    // This works even tho routes is holey array (e.g it might have index 0 and 2 but not 1)
    // `.length` includes the holes in its count
    return routes[routes.length - 1];
}
//# sourceMappingURL=getRoutesCore.js.map