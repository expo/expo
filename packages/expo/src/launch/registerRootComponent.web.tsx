import { ComponentType } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

export default function registerRootComponent(Component: ComponentType) {
  // TODO: add development overlay + tooling into this (hmr etc)

  const $root = document.getElementById('root');
  if (!$root) {
    throw new Error('Required HTML element with id "root" was not found in the document HTML.');
  }

  // Injected by SSR HTML tags
  const root = globalThis.__EXPO_ROUTER_HYDRATE__
    ? hydrateRoot($root, <Component />)
    : createRoot($root);

  root.render(<Component />);
}
