import { AsyncLocalStorage } from 'node:async_hooks';

import type { ServerFontResourceDescriptor } from './Font.types';

type ServerFontEntry = { name: string; css: string; resourceId: string };

const ID = 'expo-generated-fonts';

type ServerStore = Map<string, ServerFontEntry>;

let storage: AsyncLocalStorage<ServerStore> | null = null;

function getStorage(): AsyncLocalStorage<ServerStore> {
  if (typeof window !== 'undefined') {
    throw new Error('expo-font server context is server-only and cannot be used in the browser.');
  }
  if (!storage) {
    storage = new AsyncLocalStorage<ServerStore>();
  }
  return storage;
}

function requireStore(): ServerStore {
  const store = getStorage().getStore();
  if (!store) {
    throw new Error(
      'expo-font server context accessed outside of withServerContext(). ' +
        'Wrap your server-side font usage in withServerContext(() => /* server code */).'
    );
  }
  return store;
}

export function withServerContext<T>(callback: () => T): T {
  if (typeof window !== 'undefined') {
    return callback();
  }
  return getStorage().run(new Map(), callback);
}

export function addServerFont(entry: ServerFontEntry): void {
  const store = requireStore();
  if (!store.has(entry.css)) {
    // Key on CSS so the same family with different options stays as separate entries.
    store.set(entry.css, entry);
  }
}

export function getServerResourceDescriptors(): ServerFontResourceDescriptor[] {
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
      type: 'style' as const,
    },
    ...links.map((resourceId) => ({
      as: 'font' as const,
      crossOrigin: '' as const,
      href: resourceId,
      rel: 'preload' as const,
      type: 'link' as const,
    })),
  ];
}

export function getLoadedServerFonts(): string[] {
  const store = getStorage().getStore();
  if (!store) {
    return [];
  }
  return [...store.values()].map(({ name }) => name);
}

export function isServerFontLoaded(name: string): boolean {
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
