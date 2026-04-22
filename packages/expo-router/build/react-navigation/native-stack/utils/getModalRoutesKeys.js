export const getModalRouteKeys = (routes, descriptors) => routes.reduce((acc, route) => {
    const { presentation } = descriptors[route.key]?.options ?? {};
    if ((acc.length && !presentation) ||
        presentation === 'modal' ||
        presentation === 'transparentModal' ||
        presentation === 'containedModal' ||
        presentation === 'containedTransparentModal' ||
        presentation === 'fullScreenModal' ||
        presentation === 'formSheet' ||
        presentation === 'pageSheet') {
        acc.push(route.key);
    }
    return acc;
}, []);
//# sourceMappingURL=getModalRoutesKeys.js.map