import { store } from './global-state/router-store';
/**
 * @hidden
 */
export const router = {
    navigate: (href, options) => store.navigate(href, options),
    push: (href, options) => store.push(href, options),
    dismiss: (count) => store.dismiss(count),
    dismissAll: () => store.dismissAll(),
    dismissTo: (href, options) => store.dismissTo(href, options),
    canDismiss: () => store.canDismiss(),
    replace: (href, options) => store.replace(href, options),
    back: () => store.goBack(),
    canGoBack: () => store.canGoBack(),
    setParams: (params) => store.setParams(params),
    reload: () => store.reload(),
};
//# sourceMappingURL=imperative-api.js.map