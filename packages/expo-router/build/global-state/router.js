import { IS_DOM } from 'expo/dom';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { routingQueue } from './routingQueue';
import { store } from './store';
import { emitDomDismiss, emitDomDismissAll, emitDomGoBack, emitDomLinkEvent, emitDomSetParams, } from '../domComponents/emitDomEvent';
import { resolveHref } from '../link/href';
import { shouldLinkExternally } from '../utils/url';
export function navigate(url, options) {
    return linkTo(resolveHref(url), { ...options, event: 'NAVIGATE' });
}
export function reload() {
    // TODO(EvanBacon): add `reload` support.
    throw new Error('The reload method is not implemented in the client-side router yet.');
}
export function prefetch(href, options) {
    return linkTo(resolveHref(href), { ...options, event: 'PRELOAD' });
}
export function push(url, options) {
    return linkTo(resolveHref(url), { ...options, event: 'PUSH' });
}
export function dismiss(count = 1) {
    if (emitDomDismiss(count)) {
        return;
    }
    routingQueue.add({ type: 'POP', payload: { count } });
}
export function dismissTo(href, options) {
    return linkTo(resolveHref(href), { ...options, event: 'POP_TO' });
}
export function replace(url, options) {
    return linkTo(resolveHref(url), { ...options, event: 'REPLACE' });
}
export function dismissAll() {
    if (emitDomDismissAll()) {
        return;
    }
    routingQueue.add({ type: 'POP_TO_TOP' });
}
export function goBack() {
    if (emitDomGoBack()) {
        return;
    }
    store.assertIsReady();
    routingQueue.add({ type: 'GO_BACK' });
}
export function canGoBack() {
    if (IS_DOM) {
        throw new Error('canGoBack imperative method is not supported. Pass the property to the DOM component instead.');
    }
    // Return a default value here if the navigation hasn't mounted yet.
    // This can happen if the user calls `canGoBack` from the Root Layout route
    // before mounting a navigator. This behavior exists due to React Navigation being dynamically
    // constructed at runtime. We can get rid of this in the future if we use
    // the static configuration internally.
    if (!store.navigationRef.isReady()) {
        return false;
    }
    return store.navigationRef?.current?.canGoBack() ?? false;
}
export function canDismiss() {
    if (IS_DOM) {
        throw new Error('canDismiss imperative method is not supported. Pass the property to the DOM component instead.');
    }
    let state = store.state;
    // Keep traversing down the state tree until we find a stack navigator that we can pop
    while (state) {
        if (state.type === 'stack' && state.routes.length > 1) {
            return true;
        }
        if (state.index === undefined)
            return false;
        state = state.routes?.[state.index]?.state;
    }
    return false;
}
export function setParams(params = {}) {
    if (emitDomSetParams(params)) {
        return;
    }
    store.assertIsReady();
    return (store.navigationRef?.current?.setParams)(params);
}
export function linkTo(originalHref, options = {}) {
    originalHref = typeof originalHref == 'string' ? originalHref : resolveHref(originalHref);
    let href = originalHref;
    if (emitDomLinkEvent(href, options)) {
        return;
    }
    if (shouldLinkExternally(href)) {
        if (href.startsWith('//') && Platform.OS !== 'web') {
            href = `https:${href}`;
        }
        Linking.openURL(href);
        return;
    }
    if (href === '..' || href === '../') {
        store.assertIsReady();
        const navigationRef = store.navigationRef.current;
        if (navigationRef == null) {
            throw new Error("Couldn't find a navigation object. Is your component inside NavigationContainer?");
        }
        if (!store.linking) {
            throw new Error('Attempted to link to route when no routes are present');
        }
        navigationRef.goBack();
        return;
    }
    const linkAction = {
        type: 'ROUTER_LINK',
        payload: {
            href,
            options,
        },
    };
    routingQueue.add(linkAction);
}
/**
 * @hidden
 */
export const router = {
    navigate,
    push,
    dismiss,
    dismissAll,
    dismissTo,
    canDismiss,
    replace,
    back: () => goBack(),
    canGoBack,
    reload,
    prefetch,
    setParams: setParams,
};
//# sourceMappingURL=router.js.map