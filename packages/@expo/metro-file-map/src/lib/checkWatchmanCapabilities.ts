/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';

export default async function checkWatchmanCapabilities(
  requiredCapabilities: readonly string[]
): Promise<{ version: string }> {
  const execFilePromise = promisify(execFile);

  let rawResponse;
  try {
    const result = await execFilePromise('watchman', [
      'list-capabilities',
      '--output-encoding=json',
      '--no-pretty',
      '--no-spawn', // The client can answer this, so don't spawn a server
    ]);
    rawResponse = result.stdout;
  } catch (e) {
    if ((e as any)?.code === 'ENOENT') {
      throw new Error('Watchman is not installed or not available on PATH');
    }
    throw e;
  }

  let parsedResponse: unknown;
  try {
    parsedResponse = JSON.parse(rawResponse);
  } catch {
    throw new Error('Failed to parse response from `watchman list-capabilities`');
  }

  if (
    parsedResponse == null ||
    typeof parsedResponse !== 'object' ||
    typeof (parsedResponse as any).version !== 'string' ||
    !Array.isArray((parsedResponse as any).capabilities)
  ) {
    throw new Error('Unexpected response from `watchman list-capabilities`');
  }
  const version: string = (parsedResponse as any).version;
  const capabilities = new Set((parsedResponse as any).capabilities);
  const missingCapabilities = requiredCapabilities.filter(
    (requiredCapability) => !capabilities.has(requiredCapability)
  );
  if (missingCapabilities.length > 0) {
    throw new Error(
      `The installed version of Watchman (${version}) is missing required capabilities: ${missingCapabilities.join(
        ', '
      )}`
    );
  }
  return { version };
}
