/**
 * Copyright 2025-present 650 Industries (Expo). All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { parseEnv } from '@expo/env';

export function parseEnvFile(src: string, isClient: boolean): Record<string, string> {
  const output: Record<string, string> = {};
  const env = parseEnv(src);
  for (const key of Object.keys(env)) {
    if (env[key] != null) {
      if (isClient && !key.startsWith('EXPO_PUBLIC_')) {
        // Don't include non-public variables in the client bundle.
        continue;
      }
      output[key] = env[key];
    }
  }
  return output;
}
