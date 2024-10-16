import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

import HMRClient from '@expo/metro-runtime/src/HMRClient';

export default function registerRootComponent(component) {
  let qualifiedComponent = component;
  if (process.env.NODE_ENV !== 'production') {
    const { withDevTools } = require('./withDevTools');
    qualifiedComponent = withDevTools(component);
  }

  const $root = document.getElementById('root');
  if (!$root) {
    throw new Error('Unable to find the #root element to render to');
  }

  HMRClient.setup({ isEnabled: true });

  createRoot($root).render(createElement(qualifiedComponent));
}
