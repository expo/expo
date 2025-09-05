import fs from 'fs';
import { boolish, string } from 'getenv';
import path from 'path';

import { ExpoConfig } from './Config.types';

const debug = require('debug')('expo:config:generated');

export function withInternalGeneratedConfig(projectRoot: string, config: ExpoConfig): ExpoConfig {
  const safeLoadGeneratedConfig = (generatedPath: string): Record<string, unknown> | null => {
    if (!generatedPath) {
      return null;
    }

    try {
      const rawGenerated = fs.readFileSync(generatedPath, 'utf8');
      return JSON.parse(rawGenerated);
    } catch {
      return null;
    }
  };

  const generatedConfigs = [
    safeLoadGeneratedConfig(path.join(projectRoot, '.expo', 'generated', `app.config.json`)),
    safeLoadGeneratedConfig(string('__EXPO_GENERATED_CONFIG_PATH', '')),
  ].filter(Boolean) as Record<string, unknown>[];

  if (!generatedConfigs.length) {
    return config;
  }

  for (const generated of generatedConfigs) {
    const generatedOrigin = generated['expo.extra.router.generatedOrigin'];
    if (typeof generatedOrigin === 'string') {
      config.extra ??= {};
      config.extra.router ??= {};
      config.extra.router.generatedOrigin = generatedOrigin;
    }
  }

  return config;
}

export function getGeneratedConfigPath(projectRoot: string): string | null {
  if (boolish('CI', false)) {
    return path.join(projectRoot, '.expo', 'generated', `app.config.json`);
  }

  return string('__EXPO_GENERATED_CONFIG_PATH', '') || null;
}

export function appendShallowGeneratedConfig(
  appendedValues: Record<string, unknown>,
  { projectRoot }: { projectRoot: string }
): boolean {
  const generatedConfigPath = getGeneratedConfigPath(projectRoot);

  if (!generatedConfigPath) {
    debug('No generated config path available.');
    return false;
  }

  let generatedConfig: Record<string, unknown> = {};
  try {
    const rawGeneratedConfig = fs.readFileSync(generatedConfigPath, 'utf8');
    generatedConfig = JSON.parse(rawGeneratedConfig);
  } catch {}

  const updatedGeneratedConfig = {
    ...generatedConfig,
    ...appendedValues,
  };

  try {
    fs.mkdirSync(path.dirname(generatedConfigPath), { recursive: true });
    fs.writeFileSync(generatedConfigPath, JSON.stringify(updatedGeneratedConfig), 'utf8');
    return true;
  } catch (error) {
    debug('Failed to write generated config.', generatedConfigPath, error);
  }

  return false;
}
