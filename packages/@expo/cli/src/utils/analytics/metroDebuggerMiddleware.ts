import { ExpoConfig } from '@expo/config';
import { Middleware } from 'metro-config';

import { env } from '../env';
import { DebugTool, getMetroDebugProperties } from './getMetroDebugProperties';
import { logEventAsync } from './rudderstackClient';

/**
 * Create a Metro middleware that reports when a debugger request was found.
 * This will only be reported once, if the app uses Hermes and telemetry is not enabled.
 */
export function createDebuggerTelemetryMiddleware(
  projectRoot: string,
  exp: ExpoConfig
): Middleware {
  let hasReported = false;

  // This only works for Hermes apps, disable when telemetry is turned off
  if (env.EXPO_NO_TELEMETRY || exp.jsEngine !== 'hermes') {
    return (req, res, next) => next(undefined);
  }

  return (req, res, next) => {
    // Only report once
    if (hasReported) {
      return next(undefined);
    }

    const debugTool = findDebugTool(req);
    if (debugTool) {
      hasReported = true;
      logEventAsync('metro debug', getMetroDebugProperties(projectRoot, exp, debugTool));
    }

    return next(undefined);
  };
}

/** Exposed for testing */
export function findDebugTool(
  req: Pick<Parameters<Middleware>[0], 'headers' | 'url'>
): DebugTool | null {
  if (req.headers['origin']?.includes('chrome-devtools')) {
    return { name: 'chrome' };
  }

  if (req.url?.startsWith('/json')) {
    const flipperUserAgent = req.headers['user-agent']?.match(/(Flipper)\/([^\s]+)/);
    if (flipperUserAgent) {
      return {
        name: flipperUserAgent[1].toLowerCase(),
        version: flipperUserAgent[2],
      };
    }
  }

  return null;
}
