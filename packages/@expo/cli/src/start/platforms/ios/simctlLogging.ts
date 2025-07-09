import chalk from 'chalk';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { EOL } from 'os';
import path from 'path';
import wrapAnsi from 'wrap-ansi';

import { Device, getContainerPathAsync } from './simctl';
import * as Log from '../../../log';
import { CommandError } from '../../../utils/errors';
import { installExitHooks } from '../../../utils/exit';

export type SimControlLog = {
  /**
   * 258753568922927108
   */
  traceID: number;
  /**
   *
   * "Connection 1: done",
   */
  eventMessage: string;
  /**
   * "logEvent" | "activityCreateEvent",
   */
  eventType: 'logEvent' | 'activityCreateEvent';
  source: null | {
    /**
     * 'RCTDefaultLogFunction_block_invoke' | '__TCC_CRASHING_DUE_TO_PRIVACY_VIOLATION__'
     */
    symbol: string;
    line: number;
    /**
     * 'TCC' | 'Security' | 'CFNetwork' | 'libnetwork.dylib' | 'myapp'
     *
     * TCC is apple sys, it means "Transparency, Consent, and Control"
     */
    image: string;
    /**
     * 'RCTLog.mm' | ''
     */
    file: string;
  };
  /**
   * "Connection %llu: done"
   */
  formatString: string;
  /**
   * 0
   */
  activityIdentifier: number;
  subsystem:
    | ''
    | 'com.apple.network'
    | 'com.facebook.react.log'
    | 'com.apple.TCC'
    | 'com.apple.CoreTelephony'
    | 'com.apple.WebKit'
    | 'com.apple.runningboard'
    | string;
  category: '' | 'access' | 'connection' | 'plugin';
  /**
   * "2021-03-15 15:36:28.004331-0700"
   */
  timestamp: string;
  /**
   * 706567072091713
   */
  machTimestamp: number;
  /**
   * "Default"
   */
  messageType: 'Default' | 'Error';
  /**
   * 15192
   */
  processID: number;
};

type ProcessResolver =
  | {
      pid: string;
    }
  | {
      appId: string;
    };

export class SimulatorLogStreamer {
  private childProcess: ChildProcessWithoutNullStreams | null = null;

  static cache: SimulatorLogStreamer[] = [];

  static getStreamer = (device: Pick<Device, 'udid'>, resolver: ProcessResolver) => {
    return (
      SimulatorLogStreamer.cache.find((streamer) => streamer.device.udid === device.udid) ??
      new SimulatorLogStreamer(device, resolver)
    );
  };

  constructor(
    public device: Pick<Device, 'udid'>,
    public resolver: ProcessResolver
  ) {}

  isAttached() {
    return !!this.childProcess;
  }

  async resolvePidAsync() {
    if ('pid' in this.resolver) {
      return this.resolver.pid;
    }
    return getImageNameFromBundleIdentifierAsync(this.device.udid, this.resolver.appId);
  }

  async attachAsync() {
    await this.detachAsync();

    const pid = await this.resolvePidAsync();

    if (!pid) {
      throw new CommandError(`Could not find pid for ${this.device.udid}`);
    }

    // xcrun simctl spawn booted log stream --process --style json
    this.childProcess = spawn('xcrun', [
      'simctl',
      'spawn',
      this.device.udid,
      'log',
      'stream',
      '--process',
      pid,
      // ndjson provides a better format than json.
      '--style',
      'ndjson',
      // Provide the source so we can filter logs better
      '--source',
      // log, activity, trace -- activity was related to layouts, trace didn't work, so that leaves log.
      // Passing nothing combines all three, but we don't use activity.
      '--type',
      'log',
      // backtrace doesn't seem very useful in basic cases.
      // TODO: Maybe we can format as a stack trace for native errors.
      '--no-backtrace',
    ]);

    this.childProcess.stdout.on('data', (data: Buffer) => {
      // Sometimes more than one chunk comes at a time, here we split by system newline,
      // then trim and filter.
      const strings = data
        .toString()
        .split(EOL)
        .map((value) => value.trim())
        // This filters out the first log which says something like:
        // Filtering the log data using "process BEGINSWITH[cd] "my-app" AND type == 1024"
        .filter((value) => value.startsWith('{'));

      strings.forEach((str) => {
        const simLog = parseMessageJson(str);
        if (!simLog) {
          return;
        }
        onMessage(simLog);
      });
    });

    this.childProcess.on('error', ({ message }) => {
      Log.debug('[simctl error]:', message);
    });

    this.off = installExitHooks(() => {
      this.detachAsync.bind(this);
    });
  }

  private off: (() => void) | null = null;

  detachAsync() {
    this.off?.();
    this.off = null;
    if (this.childProcess) {
      return new Promise<void>((resolve) => {
        this.childProcess?.on('close', resolve);
        this.childProcess?.kill();
        this.childProcess = null;
      });
    }
    return Promise.resolve();
  }
}

function parseMessageJson(data: string) {
  const stringData = data.toString();
  try {
    return JSON.parse(stringData) as SimControlLog;
  } catch {
    Log.debug('Failed to parse simctl JSON message:\n' + stringData);
  }
  return null;
}

// There are a lot of networking logs in RN that aren't relevant to the user.
function isNetworkLog(simLog: SimControlLog): boolean {
  return (
    simLog.subsystem === 'com.apple.network' ||
    simLog.category === 'connection' ||
    simLog.source?.image === 'CFNetwork'
  );
}

function isReactLog(simLog: SimControlLog): boolean {
  return simLog.subsystem === 'com.facebook.react.log' && simLog.source?.file === 'RCTLog.mm';
}

// It's not clear what these are but they aren't very useful.
// (The connection to service on pid 0 named com.apple.commcenter.coretelephony.xpc was invalidated)
// We can add them later if need.
function isCoreTelephonyLog(simLog: SimControlLog): boolean {
  // [CoreTelephony] Updating selectors failed with: Error Domain=NSCocoaErrorDomain Code=4099
  // "The connection to service on pid 0 named com.apple.commcenter.coretelephony.xpc was invalidated." UserInfo={NSDebugDescription=The connection to service on pid 0 named com.apple.commcenter.coretelephony.xpc was invalidated.}
  return simLog.subsystem === 'com.apple.CoreTelephony';
}

// https://stackoverflow.com/a/65313219/4047926
function isWebKitLog(simLog: SimControlLog): boolean {
  // [WebKit] 0x1143ca500 - ProcessAssertion: Failed to acquire RBS Background assertion 'WebProcess Background Assertion' for process with PID 27084, error: Error Domain=RBSAssertionErrorDomain Code=3 "Target is not running or required target
  // entitlement is missing" UserInfo={RBSAssertionAttribute=<RBSDomainAttribute| domain:"com.apple.webkit" name:"Background" sourceEnvironment:"(null)">, NSLocalizedFailureReason=Target is not running or required target entitlement is missing}
  return simLog.subsystem === 'com.apple.WebKit';
}

// Similar to WebKit logs
function isRunningBoardServicesLog(simLog: SimControlLog): boolean {
  // [RunningBoardServices] Error acquiring assertion: <Error Domain=RBSAssertionErrorDomain Code=3 "Target is not running or required target entitlement is missing" UserInfo={RBSAssertionAttribute=<RBSDomainAttribute| domain:"com.apple.webkit"
  // name:"Background" sourceEnvironment:"(null)">, NSLocalizedFailureReason=Target is not running or required target entitlement is missing}>
  return simLog.subsystem === 'com.apple.runningboard';
}

function formatMessage(simLog: SimControlLog): string {
  // TODO: Maybe change "TCC" to "Consent" or "System".
  const category = chalk.gray(`[${simLog.source?.image ?? simLog.subsystem}]`);
  const message = simLog.eventMessage;
  return wrapAnsi(category + ' ' + message, process.stdout.columns || 80);
}

export function onMessage(simLog: SimControlLog) {
  let hasLogged = false;

  if (simLog.messageType === 'Error') {
    if (
      // Hide all networking errors which are mostly useless.
      !isNetworkLog(simLog) &&
      // Showing React errors will result in duplicate messages.
      !isReactLog(simLog) &&
      !isCoreTelephonyLog(simLog) &&
      !isWebKitLog(simLog) &&
      !isRunningBoardServicesLog(simLog)
    ) {
      hasLogged = true;
      // Sim: This app has crashed because it attempted to access privacy-sensitive data without a usage description.  The app's Info.plist must contain an NSCameraUsageDescription key with a string value explaining to the user how the app uses this data.
      Log.error(formatMessage(simLog));
    }
  } else if (simLog.eventMessage) {
    // If the source has a file (i.e. not a system log).
    if (
      simLog.source?.file ||
      simLog.eventMessage.includes('Terminating app due to uncaught exception')
    ) {
      hasLogged = true;
      Log.log(formatMessage(simLog));
    }
  }

  if (!hasLogged) {
    Log.debug(formatMessage(simLog));
  } else {
    // console.log('DATA:', JSON.stringify(simLog));
  }
}

/**
 *
 * @param udid
 * @param bundleIdentifier
 * @returns Image name like `Exponent` and `null` when the app is not installed on the provided simulator.
 */
async function getImageNameFromBundleIdentifierAsync(
  udid: string,
  bundleIdentifier: string
): Promise<string | null> {
  const containerPath = await getContainerPathAsync({ udid }, { appId: bundleIdentifier });

  if (containerPath) {
    return getImageNameFromContainerPath(containerPath);
  }
  return null;
}

function getImageNameFromContainerPath(binaryPath: string): string {
  return path.basename(binaryPath).split('.')[0];
}
