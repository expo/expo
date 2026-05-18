"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.goBack = goBack;
exports.navigate = navigate;
exports.navigateDeprecated = navigateDeprecated;
exports.reset = reset;
exports.setParams = setParams;
exports.replaceParams = replaceParams;
exports.preload = preload;
function goBack() {
    return { type: 'GO_BACK' };
}
function navigate(...args) {
    if (typeof args[0] === 'string') {
        const [name, params, options] = args;
        if (typeof options === 'boolean') {
            console.warn(`Passing a boolean as the third argument to 'navigate' is deprecated. Pass '{ merge: true }' instead.`);
        }
        return {
            type: 'NAVIGATE',
            payload: {
                name,
                params,
                merge: typeof options === 'boolean' ? options : options?.merge,
                pop: options?.pop,
            },
        };
    }
    else {
        const payload = args[0] || {};
        if (!('name' in payload)) {
            throw new Error('You need to specify a name when calling navigate with an object as the argument. See https://reactnavigation.org/docs/navigation-actions#navigate for usage.');
        }
        return { type: 'NAVIGATE', payload };
    }
}
function navigateDeprecated(...args) {
    if (typeof args[0] === 'string') {
        return {
            type: 'NAVIGATE_DEPRECATED',
            payload: { name: args[0], params: args[1] },
        };
    }
    else {
        const payload = args[0] || {};
        if (!('name' in payload)) {
            throw new Error('You need to specify a name when calling navigateDeprecated with an object as the argument. See https://reactnavigation.org/docs/navigation-actions#navigatelegacy for usage.');
        }
        return { type: 'NAVIGATE_DEPRECATED', payload };
    }
}
function reset(state) {
    return { type: 'RESET', payload: state };
}
function setParams(params) {
    return {
        type: 'SET_PARAMS',
        payload: { params },
    };
}
function replaceParams(params) {
    return {
        type: 'REPLACE_PARAMS',
        payload: { params },
    };
}
function preload(name, params) {
    return {
        type: 'PRELOAD',
        payload: { name, params },
    };
}
//# sourceMappingURL=CommonActions.js.map