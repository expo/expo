let initialized = false;

export const isInitialized = () => initialized;

export function initReactNavigationIntegration() {
  initialized = true;
}
