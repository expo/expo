import type { ObserveIntegrationsConfig } from '../../types';

let initialized = false;
let reactNavigationIntegrationConfig: ObserveIntegrationsConfig['react-navigation'];

export const isInitialized = () => initialized;
export const getReactNavigationIntegrationConfig = () => reactNavigationIntegrationConfig;

export function initReactNavigationIntegration(
  config?: ObserveIntegrationsConfig['react-navigation']
) {
  initialized = true;
  reactNavigationIntegrationConfig = config;
}
