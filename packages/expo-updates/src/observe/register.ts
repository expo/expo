import { addLogEntryListener, readLogEntriesAsync } from '../Updates';
import { createExpoUpdatesObserveIntegration } from './integration';
import type { ObserveIntegration, ObserveIntegrationRegistry } from './types';

// The registry key of `expo-observe`. The integration registers through it, so `expo-updates`
// does not depend on `expo-observe`, and either package can load first.
const REGISTRY_KEY = '__expo_observe_integrations__';

type RegistryGlobal = typeof globalThis & {
  [REGISTRY_KEY]?: ObserveIntegrationRegistry;
};

/**
 * Adds the `expo-updates` integration to the `expo-observe` integration registry, once.
 */
export function registerUpdatesObserveIntegration(): void {
  const global = globalThis as RegistryGlobal;
  global[REGISTRY_KEY] ??= { integrations: [] };
  const registry = global[REGISTRY_KEY];
  if (registry.integrations.some((integration) => integration.name === 'expo-updates')) {
    return;
  }
  const integration: ObserveIntegration = createExpoUpdatesObserveIntegration({
    readLogEntriesAsync,
    addLogEntryListener,
  });
  registry.integrations.push(integration);
  registry.onRegister?.(integration);
}
