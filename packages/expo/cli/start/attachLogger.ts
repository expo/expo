import bunyan from '@expo/bunyan';
import chalk from 'chalk';
// TODO: NO LODASH
import findLastIndex from 'lodash/findLastIndex';
import ProgressBar from 'progress';

import * as Log from '../log';
import StatusEventEmitter from '../utils/analytics/StatusEventEmitter';
import { EXPO_DEBUG } from '../utils/env';
import { logNewSection } from '../utils/ora';
import { getProgressBar, setProgressBar } from '../utils/progress';
import { getLogger, LoadingEvent } from './logger';
import PackagerLogsStream, { LogRecord, LogUpdater } from './metro/PackagerLogsStream';

/**
 * Given a line from a metro stack trace, this can attempt to extract
 * the file name or URL, omitting the code location.
 * Can be used to filter files from the stacktrace like LogBox.
 *
 * @param traceLine
 */
export function matchFileNameOrURLFromStackTrace(traceMessage: string): string | null {
  if (!traceMessage.includes(' in ')) return null;
  const traceLine = traceMessage.split(' in ')[0]?.trim();
  // Is URL
  // "http://127.0.0.1:19000/index.bundle?platform=ios&dev=true&hot=false&minify=false:110910:3 in global code"
  if (traceLine.match(/https?:\/\//g)) {
    const [url, params] = traceLine.split('?');

    const results: string[] = [url];
    if (params) {
      const paramsWithoutLocation = params.replace(/:(\d+)/g, '').trim();
      results.push(paramsWithoutLocation);
    }
    return results.filter(Boolean).join('?');
  }

  // "node_modules/react-native/Libraries/LogBox/LogBox.js:117:10 in registerWarning"
  // "somn.js:1:0 in <global>"
  return traceLine.replace(/:(\d+)/g, '').trim();
}

export async function attachLogger(projectRoot: string) {
  const { INTERNAL_CALLSITES_REGEX } = await import('@expo/metro-config');
  const logLines = (msg: any, logFn: (...args: any[]) => void) => {
    if (typeof msg === 'string') {
      for (const line of msg.split('\n')) {
        logFn(line);
      }
    } else {
      logFn(msg);
    }
  };
  const logStackTrace = async (
    chunk: LogRecord,
    logFn: (...args: any[]) => void,
    nestedLogFn: (...args: any[]) => void
  ) => {
    let traceInfo;
    try {
      traceInfo = JSON.parse(chunk.msg);
    } catch (e) {
      return logFn(chunk.msg);
    }

    const { message, stack } = traceInfo;
    Log.log();
    logFn(chalk.bold(message));

    const isLibraryFrame = (line: string) => {
      return line.startsWith('node_modules');
    };

    const stackFrames: string[] = stack.split('\n').filter((line: string) => line);
    const lastAppCodeFrameIndex = findLastIndex(stackFrames, (line: string) => {
      return !isLibraryFrame(line);
    });
    let lastFrameIndexToLog = Math.min(
      stackFrames.length - 1,
      lastAppCodeFrameIndex + 2 // show max two more frames after last app code frame
    );
    let unloggedFrames = stackFrames.length - lastFrameIndexToLog;

    // If we're only going to exclude one frame, just log them all
    if (unloggedFrames === 1) {
      lastFrameIndexToLog = stackFrames.length - 1;
      unloggedFrames = 0;
    }

    for (let i = 0; i <= lastFrameIndexToLog; i++) {
      const line = stackFrames[i];

      if (!line) {
        continue;
      }

      let isCollapsed = false;
      const fileNameOrUrl = matchFileNameOrURLFromStackTrace(line);
      if (fileNameOrUrl) {
        // Use the same regex we use in Metro config to filter out traces:
        isCollapsed = INTERNAL_CALLSITES_REGEX.test(fileNameOrUrl);

        // Unless the user is in debug mode, skip printing the collapsed files.
        if (!EXPO_DEBUG && isCollapsed) {
          continue;
        }
      }

      // If a file is collapsed, print it with dim styling.
      const style = isCollapsed ? chalk.dim : (message: string) => message;
      // Use the `at` prefix to match Node.js
      nestedLogFn(style('at ' + line));
    }

    if (unloggedFrames > 0) {
      nestedLogFn(`- ... ${unloggedFrames} more stack frames from framework internals`);
    }

    Log.log();
  };

  const logWithLevel = (chunk: LogRecord) => {
    if (!chunk.msg) {
      return;
    }
    if (chunk.level <= bunyan.INFO) {
      if (chunk.includesStack) {
        logStackTrace(chunk, Log.log, Log.log);
      } else {
        logLines(chunk.msg, Log.log);
      }
    } else if (chunk.level === bunyan.WARN) {
      if (chunk.includesStack) {
        logStackTrace(chunk, Log.warn, Log.warn);
      } else {
        logLines(chunk.msg, Log.warn);
      }
    } else {
      if (chunk.includesStack) {
        logStackTrace(chunk, Log.error, Log.error);
      } else {
        logLines(chunk.msg, Log.error);
      }
    }
  };

  let bar: ProgressBar | null;
  // eslint-disable-next-line no-new
  new PackagerLogsStream({
    projectRoot,
    onStartBuildBundle({ bundleDetails }) {
      // TODO: Unify with commands/utils/progress.ts
      const platform = PackagerLogsStream.getPlatformTagForBuildDetails(bundleDetails);
      bar = new ProgressBar(`${platform}Bundling JavaScript [:bar] :percent`, {
        width: 64,
        total: 100,
        clear: true,
        complete: '=',
        incomplete: ' ',
      });

      setProgressBar(bar);
    },
    onProgressBuildBundle({ progress }) {
      if (!bar || bar.complete) return;
      const ticks = progress - bar.curr;
      ticks > 0 && bar.tick(ticks);
    },
    onFinishBuildBundle({ error, start, end, bundleDetails }) {
      if (bar && !bar.complete) {
        bar.tick(100 - bar.curr);
      }

      if (bar) {
        setProgressBar(null);
        bar.terminate();
        bar = null;

        const platform = PackagerLogsStream.getPlatformTagForBuildDetails(bundleDetails);
        const totalBuildTimeMs = end.getTime() - start.getTime();
        const durationSuffix = chalk.gray(` ${totalBuildTimeMs}ms`);
        if (error) {
          Log.log(chalk.red(`${platform}Bundling failed` + durationSuffix));
        } else {
          Log.log(chalk.green(`${platform}Bundling complete` + durationSuffix));
          StatusEventEmitter.emit('bundleBuildFinish', { totalBuildTimeMs });
        }
      }
    },
    updateLogs: (updater: LogUpdater) => {
      const newLogChunks = updater([]);
      newLogChunks.forEach((newLogChunk: LogRecord) => {
        if (newLogChunk.issueId && newLogChunk.issueCleared) {
          return;
        }
        logWithLevel(newLogChunk);
      });
    },
  });

  // needed for validation logging to function
  getLogger(projectRoot).addStream({
    stream: {
      write: (chunk: LogRecord) => {
        if (chunk.tag === 'device') {
          logWithLevel(chunk);
          StatusEventEmitter.emit('deviceLogReceive', {
            deviceId: chunk.deviceId,
            deviceName: chunk.deviceName,
          });
        }
      },
    },
    type: 'raw',
  });
}

export function _registerLogs() {
  const stream: bunyan.Stream = {
    level: EXPO_DEBUG ? 'debug' : 'info',
    stream: {
      write: (chunk: any) => {
        if (chunk.code) {
          switch (chunk.code) {
            case LoadingEvent.START_PROGRESS_BAR: {
              const bar = new ProgressBar(chunk.msg, {
                width: 64,
                total: 100,
                clear: true,
                complete: '=',
                incomplete: ' ',
              });
              setProgressBar(bar);
              return;
            }
            case LoadingEvent.TICK_PROGRESS_BAR: {
              const bar = getProgressBar();
              if (bar) {
                bar.tick(1, chunk.msg);
              }
              return;
            }
            case LoadingEvent.STOP_PROGRESS_BAR: {
              const bar = getProgressBar();
              if (bar) {
                setProgressBar(null);
                bar.terminate();
              }
              return;
            }
            case LoadingEvent.START_LOADING:
              logNewSection(chunk.msg || '');
              return;
            case LoadingEvent.STOP_LOADING: {
              const spinner = Log.getSpinner();
              if (spinner) {
                spinner.stop();
              }
              return;
            }
          }
        }

        if (chunk.level === bunyan.INFO) {
          Log.log(chunk.msg);
        } else if (chunk.level === bunyan.WARN) {
          Log.warn(chunk.msg);
        } else if (chunk.level === bunyan.DEBUG) {
          Log.debug(chunk.msg);
        } else if (chunk.level >= bunyan.ERROR) {
          Log.error(chunk.msg);
        }
      },
    },
    type: 'raw',
  };

  Logger.notifications.addStream(stream);
  Logger.global.addStream(stream);
}
