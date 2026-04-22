export function createParamsFromAction({ action, routeParamList }) {
    const { name, params } = action.payload;
    return routeParamList[name] !== undefined
        ? {
            ...routeParamList[name],
            ...params,
        }
        : params;
}
//# sourceMappingURL=createParamsFromAction.js.map