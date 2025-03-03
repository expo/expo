import * as queryString from 'query-string';
export function reconstructState(state, getState, options) {
    const segments = [];
    const allParams = {};
    while (state?.routes?.length) {
        const route = state.routes[state.routes.length - 1];
        segments.push(...route.name.split('/'));
        state = route.state;
        if (route.params) {
            const { screen, params, ...other } = route.params;
            Object.assign(allParams, other);
            if (screen) {
                state = {
                    routeNames: [screen],
                    routes: [{ name: screen, params }],
                };
            }
        }
    }
    if (segments.length && segments[segments.length - 1] === 'index') {
        segments.pop();
    }
    let path = `/${segments.filter(Boolean).join('/')}`;
    const query = queryString.stringify(allParams, { sort: false });
    if (query) {
        path += `?${query}`;
    }
    return getState(path, options);
}
//# sourceMappingURL=routeInfo.js.map