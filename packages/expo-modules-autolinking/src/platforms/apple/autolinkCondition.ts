import fs from 'fs';
import path from 'path';

import type { AppleAutolinkCondition } from '../../types';

const APPLE_PROPERTIES_FILE = 'Podfile.properties.json';

export interface AppleAutolinkContext {
  /**
   * Names of the native-module dependencies resolved for this platform (keys of the
   * autolinking `ResolutionResult`). Used to gate `npmPackage` conditions — membership
   * here respects the real resolution rules (include/exclude, remapping, RN config) and is
   * computed once per platform.
   */
  resolvedDependencyNames?: Set<string>;
  /** Native (iOS) project directory where `Podfile.properties.json` lives. */
  commandRoot?: string;
}

/**
 * Evaluates whether a conditional podspec entry should be autolinked.
 *
 * The gate consults the already-resolved dependency set rather than re-resolving, so it
 * stays consistent with how the autolinker actually links native modules.
 *
 * When the context is absent (e.g. the deprecated JS API called without it), an
 * `npmPackage` condition resolves to `false` (the pod is omitted) and a `podfileProperty`
 * condition resolves to linked-unless-explicitly-disabled.
 */
export function appleAutolinkConditionMet(
  condition: AppleAutolinkCondition,
  context: AppleAutolinkContext
): boolean {
  if ('npmPackage' in condition && condition.npmPackage) {
    return !!context.resolvedDependencyNames?.has(condition.npmPackage);
  }

  if ('podfileProperty' in condition && condition.podfileProperty) {
    if (!context.commandRoot) {
      return false;
    }
    const properties = readPodfileProperties(context.commandRoot);
    // Linked unless the property is explicitly set to the disabled value.
    return properties[condition.podfileProperty] !== condition.disabledValue;
  }

  return false;
}

function readPodfileProperties(nativeRoot: string): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(path.join(nativeRoot, APPLE_PROPERTIES_FILE), 'utf8'));
  } catch {
    return {};
  }
}
