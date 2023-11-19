"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertStaticParams = exports.loadStaticParamsAsync = void 0;
async function loadStaticParamsAsync(route) {
    const expandedChildren = await Promise.all(route.children.map((route) => loadStaticParamsRecursive(route, { parentParams: {} })));
    route.children = expandedChildren.flat();
    return route;
}
exports.loadStaticParamsAsync = loadStaticParamsAsync;
async function loadStaticParamsRecursive(route, props) {
    if (!route?.dynamic && !route?.children?.length) {
        return [route];
    }
    const loaded = await route.loadRoute();
    let staticParams = [];
    if (loaded.generateStaticParams) {
        staticParams = await loaded.generateStaticParams({
            params: props.parentParams || {},
        });
        assertStaticParamsType(staticParams);
        // Assert that at least one param from each matches the dynamic route.
        staticParams.forEach((params) => assertStaticParams(route, params));
    }
    const traverseForNode = async (nextParams) => {
        const nextChildren = [];
        for (const child of route.children) {
            const children = await loadStaticParamsRecursive(child, {
                ...props,
                parentParams: nextParams,
            });
            nextChildren.push(...children);
        }
        return uniqBy(nextChildren, (i) => i.route);
    };
    if (!staticParams.length) {
        const nextParams = {
            ...props.parentParams,
        };
        route.children = await traverseForNode(nextParams);
        return [route];
    }
    const createParsedRouteName = (input, params) => {
        let parsedRouteName = input;
        route.dynamic?.map((query) => {
            const param = params[query.name];
            const formattedParameter = Array.isArray(param) ? param.join('/') : param;
            if (query.deep) {
                parsedRouteName = parsedRouteName.replace(`[...${query.name}]`, formattedParameter);
            }
            else {
                parsedRouteName = parsedRouteName.replace(`[${query.name}]`, param);
            }
        });
        return parsedRouteName;
    };
    const generatedRoutes = await Promise.all(staticParams.map(async (params) => {
        const nextParams = {
            ...props.parentParams,
            ...params,
        };
        const dynamicChildren = await traverseForNode(nextParams);
        const parsedRoute = createParsedRouteName(route.route, params);
        const generatedContextKey = createParsedRouteName(route.contextKey, params);
        return {
            ...route,
            // TODO: Add a new field for this
            contextKey: generatedContextKey,
            // Convert the dynamic route to a static route.
            dynamic: null,
            route: parsedRoute,
            children: dynamicChildren,
        };
    }));
    return [route, ...generatedRoutes];
}
/** lodash.uniqBy */
function uniqBy(array, key) {
    const seen = {};
    return array.filter((item) => {
        const k = key(item);
        if (seen[k]) {
            return false;
        }
        seen[k] = true;
        return true;
    });
}
function assertStaticParamsType(params) {
    if (!Array.isArray(params)) {
        throw new Error(`generateStaticParams() must return an array of params, received ${params}`);
    }
}
function formatExpected(expected, received) {
    const total = {
        ...received,
    };
    for (const item of expected) {
        if (total[item] == null) {
            total[item] = String(total[item]);
        }
        else {
            total[item] = `"${total[item]}"`;
        }
    }
    return [
        '{',
        Object.entries(total)
            .map(([key, value]) => `  "${key}": ${value}`)
            .join(',\n'),
        '}',
    ].join('\n');
}
function assertStaticParams(route, params) {
    // Type checking
    if (!route.dynamic) {
        throw new Error('assertStaticParams() must be called on a dynamic route.');
    }
    const matches = route.dynamic.every((dynamic) => {
        const value = params[dynamic.name];
        return value !== undefined && value !== null;
    });
    if (!matches) {
        const plural = route.dynamic.length > 1 ? 's' : '';
        const expected = route.dynamic.map((dynamic) => dynamic.name);
        throw new Error(`[${route.contextKey}]: generateStaticParams() must return an array of params that match the dynamic route${plural}. Expected non-nullish values for key${plural}: ${expected
            .map((v) => `"${v}"`)
            .join(', ')}.\nReceived:\n${formatExpected(expected, params)}`);
    }
    const validateSingleParam = (dynamic, value, allowMultipleSegments) => {
        if (typeof value !== 'string') {
            throw new Error(`generateStaticParams() for route "${route.contextKey}" expected param "${dynamic.name}" to be of type string, instead found "${typeof value}" while parsing "${value}".`);
        }
        const parts = value.split('/').filter(Boolean);
        if (parts.length > 1 && !allowMultipleSegments) {
            throw new Error(`generateStaticParams() for route "${route.contextKey}" expected param "${dynamic.name}" to not contain "/" (multiple segments) while parsing "${value}".`);
        }
        if (parts.length === 0) {
            throw new Error(`generateStaticParams() for route "${route.contextKey}" expected param "${dynamic.name}" not to be empty while parsing "${value}".`);
        }
    };
    // `[shape]/bar/[...colors]` -> `[shape]`, `[...colors]`
    for (const dynamic of route.dynamic) {
        let parameter = params[dynamic.name];
        if (dynamic.deep) {
            if (Array.isArray(parameter)) {
                parameter = parameter.filter(Boolean).join('/');
            }
            validateSingleParam(dynamic, parameter, true);
        }
        else {
            validateSingleParam(dynamic, parameter);
        }
    }
}
exports.assertStaticParams = assertStaticParams;
//# sourceMappingURL=loadStaticParamsAsync.js.map