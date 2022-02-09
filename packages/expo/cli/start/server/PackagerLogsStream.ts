import bunyan from '@expo/bunyan';
import { JSONObject } from '@expo/json-file';
import chalk from 'chalk';
import path from 'path';
import ProgressBar from 'progress';

import * as Log from '../../log';
import StatusEventEmitter from '../../utils/analytics/StatusEventEmitter';
import { EXPO_DEBUG } from '../../utils/env';
import { setProgressBar } from '../../utils/progress';
import { getLogger, LogFields } from '../logger';

type BuildEventType =
  | 'METRO_INITIALIZE_STARTED'
  | 'BUILD_STARTED'
  | 'BUILD_PROGRESS'
  | 'BUILD_FAILED'
  | 'BUILD_DONE';
type MetroLogRecord = {
  tag: 'metro';
  id: string;
  shouldHide: boolean;
  msg: ReportableEvent | string;
  level: number;
  _metroEventType?: BuildEventType;
};
type ExpoLogRecord = {
  tag: 'expo';
  id: string;
  shouldHide: boolean;
  msg: any;
  level: number;
};
type DeviceLogRecord = {
  tag: 'device';
  id: string;
  shouldHide: boolean;
  msg: any;
  level: number;
  deviceId: string;
  deviceName: string;
};
export type LogRecord = (MetroLogRecord | ExpoLogRecord | DeviceLogRecord) & LogFields;

export type LogUpdater = (logState: LogRecord[]) => LogRecord[];

type ErrorObject = {
  name?: string;
  stack?: string;
  message?: string;
  code?: string;
} & JSONObject;

type MetroError =
  | ({
      originModulePath: string;
      message: string;
      errors: { description: string; filename: string; lineNumber: number }[];
    } & ErrorObject)
  | ({
      type: 'TransformError';
      snippet: string;
      lineNumber: number;
      column: number;
      filename: string;
      errors: { description: string; filename: string; lineNumber: number }[];
    } & ErrorObject)
  | ErrorObject;

// Metro reporter types
// https://github.com/facebook/metro/blob/2a327fb19dd62169ab3ae9069011d8a599cfcf3e/packages/metro/src/lib/reporting.js
type GlobalCacheDisabledReason = 'too_many_errors' | 'too_many_misses';
type BundleDetails = {
  entryFile: string;
  platform: string;
  dev: boolean;
  minify: boolean;
  bundleType: string;
};
type ReportableEvent =
  | {
      port: number | undefined;
      projectRoots: readonly string[];
      type: 'initialize_started';
    }
  | {
      type: 'initialize_done';
    }
  | {
      type: 'client_log';
      data: any;
    }
  | {
      type: 'initialize_failed';
      port: number;
      error: MetroError;
    }
  | {
      buildID: string;
      type: 'bundle_build_done';
    }
  | {
      buildID: string;
      type: 'bundle_build_failed';
    }
  | {
      buildID: string;
      bundleDetails: BundleDetails;
      type: 'bundle_build_started';
    }
  | {
      error: MetroError;
      type: 'bundling_error';
    }
  | {
      // Currently only sent from Webpack
      warning: string;
      type: 'bundling_warning';
    }
  | {
      type: 'dep_graph_loading';
    }
  | {
      type: 'dep_graph_loaded';
    }
  | {
      buildID: string;
      type: 'bundle_transform_progressed';
      transformedFileCount: number;
      totalFileCount: number;

      // A special property added for webpack support
      percentage?: number;
    }
  | {
      type: 'global_cache_error';
      error: MetroError;
    }
  | {
      type: 'global_cache_disabled';
      reason: GlobalCacheDisabledReason;
    }
  | {
      type: 'transform_cache_reset';
    }
  | {
      type: 'worker_stdout_chunk';
      chunk: string;
    }
  | {
      type: 'worker_stderr_chunk';
      chunk: string;
    }
  | {
      type: 'hmr_client_error';
      error: MetroError;
    };

export default class PackagerLogsStream {
  updateLogs: (updater: LogUpdater) => void;
  _logsToAdd: LogRecord[] = [];
  _bundleBuildChunkID: string | null = null;
  _bundleBuildStart: Date | null = null;

  constructor(
    public projectRoot: string,
    {
      updateLogs,
    }: {
      updateLogs: (updater: LogUpdater) => void;
    }
  ) {
    this.updateLogs = updateLogs;

    this.attachLoggerStream();
  }

  projectId?: number;

  getCurrentOpenProjectId() {
    return 1;
  }

  attachLoggerStream() {
    this.projectId = this.getCurrentOpenProjectId();

    getLogger().addStream({
      stream: {
        write: this._handleChunk.bind(this),
      },
      type: 'raw',
    });
  }

  _handleChunk(chunk: LogRecord) {
    if (chunk.tag !== 'metro' && chunk.tag !== 'expo') {
      return;
    } else if (this.getCurrentOpenProjectId() !== this.projectId) {
      // TODO: We should be confident that we are properly unsubscribing
      // from the stream rather than doing a defensive check like this.
      return;
    }

    chunk = this.maybeParseMsgJSON(chunk);
    chunk = this.cleanUpNodeErrors(chunk);
    if (chunk.tag === 'metro') {
      this._handleMetroEvent(chunk);
    } else if (typeof chunk.msg === 'string' && chunk.msg.match(/\w/) && chunk.msg[0] !== '{') {
      this._enqueueAppendLogChunk(chunk);
    }
  }

  _handleMetroEvent(originalChunk: MetroLogRecord) {
    const chunk = { ...originalChunk };
    const { msg } = chunk;

    if (typeof msg === 'string') {
      if ((msg as string).includes('HTTP/1.1') && !EXPO_DEBUG) {
        // Do nothing with this message - we want to filter out network requests logged by Metro.
      } else {
        // If Metro crashes for some reason, it may log an error message as a plain string to stderr.
        this._enqueueAppendLogChunk(chunk);
      }
      return;
    }

    switch (msg.type) {
      // Bundle transform events
      case 'bundle_build_started':
      case 'bundle_transform_progressed':
      case 'bundle_build_failed':
      case 'bundle_build_done':
        this._handleBundleTransformEvent(chunk);
        return;

      case 'initialize_started':
        chunk._metroEventType = 'METRO_INITIALIZE_STARTED';
        chunk.msg = 'Starting Metro Bundler';
        break;
      case 'initialize_done':
        chunk.msg = `Started Metro Bundler`;
        break;
      case 'initialize_failed': {
        // SDK <=22
        const code = msg.error.code;
        chunk.msg =
          code === 'EADDRINUSE'
            ? `Metro Bundler can't listen on port ${msg.port}. The port is in use.`
            : `Metro Bundler failed to start. (code: ${code})`;
        break;
      }
      case 'bundling_error':
        chunk.msg =
          this._formatModuleResolutionError(msg.error) ||
          this._formatBundlingError(msg.error) ||
          msg;
        chunk.level = bunyan.ERROR;
        break;
      case 'bundling_warning':
        chunk.msg = msg.warning;
        chunk.level = bunyan.WARN;
        break;
      case 'transform_cache_reset':
        chunk.msg =
          'Your JavaScript transform cache is empty, rebuilding (this may take a minute).';
        break;
      case 'hmr_client_error':
        chunk.msg = `A WebSocket client got a connection error. Please reload your device to get HMR working again.`;
        break;
      case 'global_cache_disabled':
        if (msg.reason === 'too_many_errors') {
          chunk.msg =
            'The global cache is now disabled because it has been failing too many times.';
        } else if (msg.reason === 'too_many_misses') {
          chunk.msg = `The global cache is now disabled because it has been missing too many consecutive keys.`;
        } else {
          chunk.msg = `The global cache is now disabled. Reason: ${msg.reason}`;
        }
        break;
      case 'worker_stdout_chunk':
        chunk.msg = this._formatWorkerChunk('stdout', msg.chunk);
        break;
      case 'worker_stderr_chunk':
        chunk.msg = this._formatWorkerChunk('stderr', msg.chunk);
        break;
      // Ignored events.
      case 'client_log':
      case 'dep_graph_loading':
      case 'dep_graph_loaded':
      case 'global_cache_error':
        return;
      default:
        chunk.msg = `Unrecognized event: ${JSON.stringify(msg)}`;
        break;
    }
    this._enqueueAppendLogChunk(chunk);
  }

  // A cache of { [buildID]: BundleDetails } which can be used to
  // add more contextual logs. BundleDetails is currently only sent with `bundle_build_started`
  // so we need to cache the details in order to print the platform info with other event types.
  bundleDetailsCache: Record<string, BundleDetails> = {};

  // Any event related to bundle building is handled here
  _handleBundleTransformEvent = (chunk: MetroLogRecord) => {
    const msg = chunk.msg as ReportableEvent;

    const bundleDetails = 'buildID' in msg ? this.bundleDetailsCache[msg.buildID] || null : null;

    if (msg.type === 'bundle_build_started') {
      // Cache bundle details for later.
      this.bundleDetailsCache[String(msg.buildID)] = msg.bundleDetails;
      chunk._metroEventType = 'BUILD_STARTED';
      this._handleNewBundleTransformStarted(chunk, msg.bundleDetails);
    } else if (msg.type === 'bundle_transform_progressed' && this._bundleBuildChunkID) {
      chunk._metroEventType = 'BUILD_PROGRESS';
      this._handleUpdateBundleTransformProgress(chunk, bundleDetails);
    } else if (msg.type === 'bundle_build_failed' && this._bundleBuildChunkID) {
      chunk._metroEventType = 'BUILD_FAILED';
      this._handleUpdateBundleTransformProgress(chunk, bundleDetails);
    } else if (msg.type === 'bundle_build_done' && this._bundleBuildChunkID) {
      chunk._metroEventType = 'BUILD_DONE';
      this._handleUpdateBundleTransformProgress(chunk, bundleDetails);
    }
  };

  static getPlatformTagForBuildDetails(bundleDetails?: BundleDetails | null) {
    const platform = bundleDetails?.platform ?? null;
    if (platform) {
      const formatted = { ios: 'iOS', android: 'Android', web: 'Web' }[platform] || platform;
      return `${chalk.bold(formatted)} `;
    }

    return '';
  }

  bar?: ProgressBar;

  private _handleNewBundleTransformStarted(
    chunk: MetroLogRecord,
    bundleDetails: BundleDetails | null
  ) {
    if (this._bundleBuildChunkID) {
      return;
    }

    this._bundleBuildChunkID = chunk.id;
    this._bundleBuildStart = new Date();

    chunk.msg = 'Building JavaScript bundle';

    // TODO: Unify with commands/utils/progress.ts
    const platform = PackagerLogsStream.getPlatformTagForBuildDetails(bundleDetails);
    this.bar = new ProgressBar(`${platform}Bundling JavaScript [:bar] :percent`, {
      width: 64,
      total: 100,
      clear: true,
      complete: '=',
      incomplete: ' ',
    });

    setProgressBar(this.bar);
  }

  private _handleUpdateBundleTransformProgress(
    progressChunk: MetroLogRecord,
    bundleDetails: BundleDetails | null
  ) {
    const msg = progressChunk.msg as ReportableEvent;

    let percentProgress;
    let bundleComplete = false;
    if (msg.type === 'bundle_build_done') {
      percentProgress = 100;
      bundleComplete = true;
      if (this._bundleBuildStart) {
        const duration = new Date().getTime() - this._bundleBuildStart.getTime();
        progressChunk.msg = `Building JavaScript bundle: finished in ${duration}ms.`;
      } else {
        progressChunk.msg = `Building JavaScript bundle: finished.`;
      }
    } else if (msg.type === 'bundle_build_failed') {
      percentProgress = -1;
      bundleComplete = true;
      progressChunk.msg = `Building JavaScript bundle: error`;
      progressChunk.level = bunyan.ERROR;
    } else if (msg.type === 'bundle_transform_progressed') {
      if (msg.percentage) {
        percentProgress = msg.percentage * 100;
      } else {
        percentProgress = (msg.transformedFileCount / msg.totalFileCount) * 100;
        // percentProgress = Math.floor((msg.transformedFileCount / msg.totalFileCount) * 100);
      }
      const roundedPercentProgress = Math.floor(100 * percentProgress) / 100;
      progressChunk.msg = `Building JavaScript bundle: ${roundedPercentProgress}%`;
    } else {
      return;
    }

    if (this._bundleBuildChunkID) {
      progressChunk.id = this._bundleBuildChunkID;
    }

    // Update progress bar...
    if (this.bar && !this.bar.complete) {
      const ticks = percentProgress - this.bar.curr;

      if (ticks > 0) {
        this.bar.tick(ticks);
      }
    }

    if (bundleComplete) {
      if (this._bundleBuildStart) {
        if (this.bar && !this.bar.complete) {
          this.bar.tick(100 - this.bar.curr);
        }

        if (this.bar) {
          setProgressBar(null);
          this.bar.terminate();
          this.bar = null;

          const platform = PackagerLogsStream.getPlatformTagForBuildDetails(bundleDetails);
          const start = this._bundleBuildStart;
          const end = new Date();
          const totalBuildTimeMs = end.getTime() - start.getTime();
          const durationSuffix = chalk.gray(` ${totalBuildTimeMs}ms`);

          const error = msg.type === 'bundle_build_failed' ? 'Build failed' : null;
          if (error) {
            Log.log(chalk.red(`${platform}Bundling failed` + durationSuffix));
          } else {
            Log.log(chalk.green(`${platform}Bundling complete` + durationSuffix));
            StatusEventEmitter.emit('bundleBuildFinish', { totalBuildTimeMs });
          }
        }
      }
      this._bundleBuildStart = null;
      this._bundleBuildChunkID = null;
    }
  }

  _formatModuleResolutionError(error: MetroError): string | null {
    if (!error.message) {
      return null;
    }
    const match = /^Unable to resolve module `(.+?)`/.exec(error.message);
    const originModulePath = error.originModulePath as string | null;
    if (!match || !originModulePath) {
      return null;
    }
    const moduleName = match[1];
    const relativePath = path.relative(this.projectRoot, originModulePath);

    const DOCS_PAGE_URL =
      'https://docs.expo.dev/workflow/using-libraries/#using-third-party-libraries';

    if (NODE_STDLIB_MODULES.includes(moduleName)) {
      if (originModulePath.includes('node_modules')) {
        return `The package at "${relativePath}" attempted to import the Node standard library module "${moduleName}". It failed because the native React runtime does not include the Node standard library. Read more at ${DOCS_PAGE_URL}`;
      } else {
        return `You attempted attempted to import the Node standard library module "${moduleName}" from "${relativePath}". It failed because the native React runtime does not include the Node standard library. Read more at ${DOCS_PAGE_URL}`;
      }
    }
    return `Unable to resolve "${moduleName}" from "${relativePath}"`;
  }

  _formatBundlingError(error: MetroError): string | null {
    let message = error.message;
    if (!message && Array.isArray(error.errors) && error.errors.length) {
      message = (error.errors[0] as any).description;
    }
    if (!message) {
      return null;
    }

    message = chalk.red(message);

    const snippet = error.snippet;
    if (snippet) {
      message += `\n${snippet}`;
    }

    // Import errors are already pretty useful and don't need extra info added to them.
    const isAmbiguousError = !error.name || ['SyntaxError'].includes(error.name);
    // When you have a basic syntax error in application code it will tell you the file
    // and usually also provide a well informed error.
    const isComprehensiveTransformError = error.type === 'TransformError' && error.filename;

    // console.log(require('util').inspect(error, { depth: 4 }));
    if (error.stack && isAmbiguousError && !isComprehensiveTransformError) {
      message += `\n${chalk.gray(error.stack)}`;
    }
    return message;
  }

  _formatWorkerChunk(origin: 'stdout' | 'stderr', chunk: string) {
    return chunk;
  }

  _enqueueAppendLogChunk(chunk: LogRecord) {
    if (!chunk.shouldHide) {
      this._logsToAdd.push(chunk);
      this._enqueueFlushLogsToAdd();
    }
  }

  _enqueueFlushLogsToAdd = () => {
    this.updateLogs((logs) => {
      if (this._logsToAdd.length === 0) {
        return logs;
      }

      const nextLogs = logs.concat(this._logsToAdd);
      this._logsToAdd = [];
      return nextLogs;
    });
  };

  private maybeParseMsgJSON(chunk: LogRecord) {
    try {
      const parsedMsg = JSON.parse(chunk.msg);
      chunk.msg = parsedMsg;
    } catch {
      // non-JSON message
    }

    return chunk;
  }

  private cleanUpNodeErrors = (chunk: LogRecord) => {
    if (typeof chunk.msg !== 'string') {
      return chunk;
    }

    chunk.msg = sanitizeNodeErrors(chunk.msg);

    return chunk;
  };
}

function sanitizeNodeErrors(msg: string): string {
  if (msg.match(/\(node:.\d*\)/)) {
    // Example: (node:13817) UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 1): SyntaxError: SyntaxError /Users/brent/universe/apps/new-project-template/main.js: Unexpected token (10:6)
    // The first part of this is totally useless, so let's remove it.
    if (msg.match(/UnhandledPromiseRejectionWarning/)) {
      msg = msg.replace(/\(node:.*\(rejection .*\):/, '');
      if (msg.match(/SyntaxError: SyntaxError/)) {
        return msg.replace('SyntaxError: ', '');
      }
    } else if (msg.match(/DeprecationWarning/)) {
      return '';
    }
  }
  return msg;
}

const NODE_STDLIB_MODULES = [
  'assert',
  'async_hooks',
  'buffer',
  'child_process',
  'cluster',
  'crypto',
  'dgram',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'https',
  'net',
  'os',
  'path',
  'punycode',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'tls',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'zlib',
];
