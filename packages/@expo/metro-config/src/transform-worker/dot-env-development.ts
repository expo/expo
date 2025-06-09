/**
 * Copyright 2025-present 650 Industries (Expo). All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as dotenv from 'dotenv';
import { expand as dotenvExpand } from 'dotenv-expand';

export function parseEnvFile(src: string, isClient: boolean): Record<string, string> {
  const expandedEnv: Record<string, string> = {};
  const envFileParsed = dotenv.parse(src);

  if (envFileParsed) {
    const allExpandedEnv = dotenvExpand({
      parsed: envFileParsed,
      processEnv: {},
    });

    for (const key of Object.keys(envFileParsed)) {
      if (allExpandedEnv.parsed?.[key]) {
        if (isClient && !key.startsWith('EXPO_PUBLIC_')) {
          // Don't include non-public variables in the client bundle.
          continue;
        }
        expandedEnv[key] = allExpandedEnv.parsed[key];
      }
    }
  }
  return expandedEnv;
}
