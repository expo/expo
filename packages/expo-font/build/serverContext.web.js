import { AsyncLocalStorage } from 'node:async_hooks';
const ID = 'expo-generated-fonts';
let storage = null;
function getStorage() {
    if (typeof window !== 'undefined') {
        throw new Error('expo-font server context is server-only and cannot be used in the browser.');
    }
    if (!storage) {
        storage = new AsyncLocalStorage();
    }
    return storage;
}
function requireStore() {
    const store = getStorage().getStore();
    if (!store) {
        throw new Error('expo-font server context accessed outside of withServerContext(). ' +
            'Wrap your server-side font usage in withServerContext(() => /* server code */).');
    }
    return store;
}
export function withServerContext(callback) {
    if (typeof window !== 'undefined') {
        return callback();
    }
    return getStorage().run(new Map(), callback);
}
export function addServerFont(entry) {
    const store = requireStore();
    if (!store.has(entry.css)) {
        // Key on CSS so the same family with different options stays as separate entries.
        store.set(entry.css, entry);
    }
}
export function getServerResourceDescriptors() {
    const entries = [...requireStore().values()];
    if (!entries.length) {
        return [];
    }
    const css = entries.map(({ css }) => css).join('\n');
    // One <link rel="preload"> per URI even if multiple @font-face entries share it.
    const links = [...new Set(entries.map(({ resourceId }) => resourceId))];
    return [
        {
            css,
            id: ID,
            type: 'style',
        },
        ...links.map((resourceId) => ({
            as: 'font',
            crossOrigin: '',
            href: resourceId,
            rel: 'preload',
            type: 'link',
        })),
    ];
}
export function getLoadedServerFonts() {
    const store = getStorage().getStore();
    if (!store) {
        return [];
    }
    return [...store.values()].map(({ name }) => name);
}
export function isServerFontLoaded(name) {
    const store = getStorage().getStore();
    if (!store) {
        return false;
    }
    for (const entry of store.values()) {
        if (entry.name === name) {
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=serverContext.web.js.map