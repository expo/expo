import Log from '@expo/bunyan';
import chalk from 'chalk';
import { HandleFunction } from 'connect';
import http from 'http';

type ConsoleLogLevel = 'info' | 'warn' | 'error' | 'debug';

export default function clientLogsMiddleware(logger: Log): HandleFunction {
  return function (
    req: http.IncomingMessage & { body?: any },
    res: http.ServerResponse,
    next: (err?: Error) => void
  ) {
    try {
      const deviceId = req.headers['device-id'];
      const deviceName = req.headers['device-name'];
      const expoPlatform = req.headers['expo-platform'];
      if (!deviceId) {
        res.writeHead(400).end('Missing Device-Id.');
        return;
      }
      if (!deviceName) {
        res.writeHead(400).end('Missing Device-Name.');
        return;
      }
      if (!req.body) {
        res.writeHead(400).end('Missing request body.');
        return;
      }
      handleDeviceLogs(logger, {
        deviceId: deviceId.toString(),
        deviceName: deviceName.toString(),
        logs: req.body,
        devicePlatform: expoPlatform?.toString(),
      });
    } catch (error: any) {
      logger.error({ tag: 'expo' }, `Error getting device logs: ${error} ${error.stack}`);
      next(error);
    }
    res.end('Success');
  };
}

function isIgnorableBugReportingExtraData(body: any[]): boolean {
  return body.length === 2 && body[0] === 'BugReporting extraData:';
}

function isAppRegistryStartupMessage(body: any[]): boolean {
  return (
    body.length === 1 &&
    (/^Running application "main" with appParams:/.test(body[0]) ||
      /^Running "main" with \{/.test(body[0]))
  );
}

export function getDevicePlatformFromAppRegistryStartupMessage(body: string[]): string | null {
  if (body.length === 1 && typeof body[0] === 'string') {
    // Dangerously pick the platform out of the request URL
    // like: http:\\\\/\\\\/192.168.6.113:19000\\\\/index.bundle&platform=android\dev=true&hot=false&minify=false
    return body[0].match(/[?|&]platform=(\w+)[&|\\]/)?.[1] ?? null;
  }
  return null;
}

function formatDevicePlatform(platform: string): string {
  // Map the ID like "ios" to "iOS"
  const formatted = { ios: 'iOS', android: 'Android', web: 'Web' }[platform] || platform;
  return `${chalk.bold(formatted)} `;
}

function handleDeviceLogs(
  logger: Log,
  {
    deviceId,
    deviceName,
    logs,
    devicePlatform,
  }: { deviceId: string; deviceName: string; devicePlatform?: string; logs: any }
): void {
  for (const log of logs) {
    let body = Array.isArray(log.body) ? log.body : [log.body];
    let { level } = log;

    if (isIgnorableBugReportingExtraData(body)) {
      level = 'debug';
    }
    if (isAppRegistryStartupMessage(body)) {
      // If the installed version of expo is sending back the `device-platform` header
      // then use that, otherwise find it in the query string.
      const platformId = devicePlatform
        ? devicePlatform
        : getDevicePlatformFromAppRegistryStartupMessage(body);

      const platform = platformId ? formatDevicePlatform(platformId) : '';
      body = [`${platform}Running app on ${deviceName}`];
    }

    const args = body.map((obj: any) => {
      if (typeof obj === 'undefined') {
        return 'undefined';
      }
      if (obj === 'null') {
        return 'null';
      }
      if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
        return obj;
      }
      try {
        return JSON.stringify(obj);
      } catch {
        return obj.toString();
      }
    });
    const logLevel =
      level === 'info' || level === 'warn' || level === 'error' || level === 'debug'
        ? (level as ConsoleLogLevel)
        : 'info';
    logger[logLevel](
      {
        tag: 'device',
        deviceId,
        deviceName,
        groupDepth: log.groupDepth,
        shouldHide: log.shouldHide,
        includesStack: log.includesStack,
      },
      ...args
    );
  }
}
