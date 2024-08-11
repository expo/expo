import React, { type ComponentType } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

export default function registerRootComponent<
  P extends {
    [key: string]: any;
  },
>(component: ComponentType<P>): void {
  let QualifiedComponent = component;

  if (process.env.NODE_ENV !== 'production') {
    const { withDevTools } = require('./withDevTools') as typeof import('./withDevTools');
    QualifiedComponent = withDevTools(component);
  }

  // Skip querying the DOM if we're in a Node.js environment.
  if (typeof window !== 'undefined') {
    // TODO: Use document.body for React Server Components
    const root = document.getElementById('root');
    if (process.env.NODE_ENV !== 'production') {
      if (!root) {
        throw new Error('Required HTML element with id "root" was not found in the document HTML.');
      }
    }

    const reactRoot = React.createElement(QualifiedComponent);

    if (process.env.EXPO_PUBLIC_USE_STATIC === '1') {
      hydrateRoot(root!, reactRoot);
    } else {
      createRoot(root!).render(reactRoot);
    }
  }
}
