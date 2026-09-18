import type { ObserveIntegrationsConfig, ObserveModule } from './types';

export function registerIntegrationImpl<K extends keyof ObserveIntegrationsConfig>(
  target: Pick<ObserveModule, 'addListener' | 'getIntegrations'>,
  name: K,
  callback: (config: ObserveIntegrationsConfig[K]) => void
): void {
  const integrations = target.getIntegrations();
  if (integrations) {
    if (integrations[name]) {
      callback(integrations[name]);
    }
    return;
  }

  const subscription = target.addListener('configure', ({ integrations }) => {
    subscription.remove();
    if (integrations?.[name]) {
      callback(integrations[name]);
    }
  });
}
