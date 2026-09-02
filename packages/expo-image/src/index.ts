import { initObserveIntegrationIfNeeded } from './observe';

// `observe.ts` is a client module ('use client'); calling it from a React server component is
// illegal.
if (typeof window !== 'undefined') {
  initObserveIntegrationIfNeeded();
}

export * from './Image.types';
export { Image } from './Image';
export { ImageBackground } from './ImageBackground';
export { useImage } from './useImage';
