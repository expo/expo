import { ExpoConfig } from '@expo/config';
import { Middleware } from 'metro-config';

import { env } from '../env';
import { getMetroDebugProperties } from './getMetroDebugProperties';
import { logEventAsync } from './rudderstackClient';

/**
 * Create a Metro middleware that reports when a Flipper request was found.
 * This will only be reported once, if the app uses Hermes and telemetry is not enabled.
 */
export function createFlipperTelemetryMiddleware(projectRoot: string, exp: ExpoConfig): Middleware {
  let hasReported = false;

  // This only works for Hermes apps, disable when telemetry is turned off
  if (env.EXPO_NO_TELEMETRY || exp.jsEngine !== 'hermes') {
    return (req, res, next) => next(undefined);
  }

  return (req, res, next) => {
    // Only report once, and only on `/json(/list)?` endpoints
    if (hasReported || !req.url?.startsWith('/json')) {
      return next(undefined);
    }

    // Check if we can determine the used tool by user agent
    const userAgent = req.headers['user-agent'];
    const debugTool = userAgent && findDebugTool(userAgent);

    if (debugTool) {
      hasReported = true;
      logEventAsync('metro debug', getMetroDebugProperties(projectRoot, debugTool, exp));
    }

    return next(undefined);
  };
}

/** Exposed for testing */
export function findDebugTool(userAgent: string) {
  const toolMatch = userAgent.match(/(Flipper)\/([^\s]+)/);
  if (!toolMatch) {
    return null;
  }

  return {
    name: toolMatch[1].toLowerCase(),
    version: toolMatch[2],
  };
}
