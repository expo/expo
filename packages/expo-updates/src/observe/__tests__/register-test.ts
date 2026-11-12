import type { ObserveIntegrationRegistry } from '../types';

const REGISTRY_KEY = '__expo_observe_integrations__';

type RegistryGlobal = typeof globalThis & { [REGISTRY_KEY]?: ObserveIntegrationRegistry };

function loadRegister() {
  return require('../register') as typeof import('../register');
}

beforeEach(() => {
  jest.resetModules();
  delete (globalThis as RegistryGlobal)[REGISTRY_KEY];
});

test('creates the registry and adds the integration when expo-observe has not loaded', () => {
  loadRegister().registerUpdatesObserveIntegration();

  const registry = (globalThis as RegistryGlobal)[REGISTRY_KEY];
  expect(registry?.integrations.map((integration) => integration.name)).toEqual(['expo-updates']);
});

test('tells expo-observe about the integration when it has already loaded', () => {
  const onRegister = jest.fn();
  (globalThis as RegistryGlobal)[REGISTRY_KEY] = { integrations: [], onRegister };

  loadRegister().registerUpdatesObserveIntegration();

  expect(onRegister).toHaveBeenCalledWith(expect.objectContaining({ name: 'expo-updates' }));
});

test('registers the integration once', () => {
  const { registerUpdatesObserveIntegration } = loadRegister();
  registerUpdatesObserveIntegration();
  registerUpdatesObserveIntegration();

  expect((globalThis as RegistryGlobal)[REGISTRY_KEY]?.integrations).toHaveLength(1);
});
