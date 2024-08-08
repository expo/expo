import type { MetroConfig } from '@expo/metro-config';
import { env } from 'node:process'

import { createConfigProxy } from './ConfigProxy';
import type { ConfigSet } from './ConfigSet';

export { createConfigSet } from './ConfigSet';

export function createConfig(metroConfig: MetroConfig, configSets: ConfigSet[]) {
  if (env.EXPO_DEBUG === 'true') {
    return createConfigWithDebug(metroConfig, configSets);
  }

  let finalConfig = metroConfig;

  for (const configSet of configSets) {
    if (!configSet.config) continue;
    finalConfig = applyConfigSet(finalConfig, configSet).config;
  }

  return finalConfig;
}

export function createConfigWithDebug(metroConfig: MetroConfig, configSets: ConfigSet[]) {
  const { deltas, config } = resolveConfig(metroConfig, configSets);

  for (const delta of deltas) {
    console.log(`[${delta.name}]: ${delta.property}:`, delta.valuePrev, '->', delta.valueNext);
  }

  return config;
}

export function resolveConfig(metroConfig: MetroConfig, configSets: ConfigSet[]) {
  let finalConfig = metroConfig;
  const deltas = [] as MetroConfigDelta<unknown>[];

  for (const configSet of configSets) {
    const { delta, config } = applyConfigSet(finalConfig, configSet);

    finalConfig = config;
    deltas.push(...delta);
  }

  return { config: finalConfig, deltas };
}

function applyConfigSet(metroConfig: MetroConfig, configSet: ConfigSet) {
  if (!configSet.config) return { delta: [], config: metroConfig };

  const metroConfigDelta = [] as MetroConfigDelta<unknown>[];
  const metroConfigProxy = createConfigProxy(metroConfig, {
    onSet(target, property, value, parentKey) {
      metroConfigDelta.push({
        name: configSet.name,
        property: parentKey ? `${parentKey}.${property}` : property,
        valuePrev: (target as any)[property],
        valueNext: value,
      });
    },
    onDelete(target, property, parentKey) {
      metroConfigDelta.push({
        name: configSet.name,
        property: parentKey ? `${parentKey}.${property}` : property,
        valuePrev: (target as any)[property],
        valueNext: null,
      });
    },
  });

  const result = configSet.config(metroConfigProxy);

  if (result && result !== metroConfigProxy) {
    throw new Error(`Config "${configSet.name}" returned an invalid result "${typeof result}"`)
  }

  return {
    delta: metroConfigDelta,
    config: result || metroConfig,
  };
}

type MetroConfigDelta<T> = {
  name: string;
  property: string;
  valuePrev: T | null | undefined;
  valueNext: T | null | undefined;
};
