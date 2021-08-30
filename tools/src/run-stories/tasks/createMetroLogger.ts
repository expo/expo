import bunyan from '@expo/bunyan';
import { INTERNAL_CALLSITES_REGEX } from '@expo/metro-config';
import { LogUpdater, PackagerLogsStream, LogRecord, ProjectUtils } from '@expo/xdl';
import chalk from 'chalk';
import findLastIndex from 'lodash/findLastIndex';
import ProgressBar from 'progress';

// This is ported / mostly copy-pasted from expo-cli/src/exp.ts
// Close to matching expo-cli's `runMetroDevServerAsync()` logger
export function createMetroLogger(projectRoot: string) {
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
      }

      // If a file is collapsed, print it with dim styling.
      const style = isCollapsed ? chalk.dim : (message: string) => message;
      // Use the `at` prefix to match Node.js
      nestedLogFn(style('at ' + line));
    }

    if (unloggedFrames > 0) {
      nestedLogFn(`- ... ${unloggedFrames} more stack frames from framework internals`);
    }
  };

  const logWithLevel = (chunk: LogRecord) => {
    if (!chunk.msg) {
      return;
    }
    if (chunk.level <= bunyan.INFO) {
      if (chunk.includesStack) {
        logStackTrace(chunk, console.log, console.log);
      } else {
        logLines(chunk.msg, console.log);
      }
    } else if (chunk.level === bunyan.WARN) {
      if (chunk.includesStack) {
        logStackTrace(chunk, console.warn, console.warn);
      } else {
        logLines(chunk.msg, console.warn);
      }
    } else {
      if (chunk.includesStack) {
        logStackTrace(chunk, console.error, console.error);
      } else {
        logLines(chunk.msg, console.error);
      }
    }
  };

  let bar: any;
  // eslint-disable-next-line
  new PackagerLogsStream({
    projectRoot,
    onStartBuildBundle: () => {
      // TODO: Unify with commands/utils/progress.ts
      bar = new ProgressBar('Building JavaScript bundle [:bar] :percent', {
        width: 64,
        total: 100,
        clear: true,
        complete: '=',
        incomplete: ' ',
      });
    },
    onProgressBuildBundle: (percent: number) => {
      if (!bar || bar.complete) return;
      const ticks = percent - bar.curr;
      ticks > 0 && bar.tick(ticks);
    },
    onFinishBuildBundle: (err, startTime, endTime) => {
      if (bar && !bar.complete) {
        bar.tick(100 - bar.curr);
      }
      if (bar) {
        bar.terminate();
        bar = null;
        if (err) {
          console.log(chalk.red('Failed building JavaScript bundle.'));
        } else {
          const totalBuildTimeMs = endTime.getTime() - startTime.getTime();
          console.log(chalk.green(`Finished building JavaScript bundle in ${totalBuildTimeMs}ms.`));
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

  const logger = ProjectUtils.getLogger(projectRoot);

  logger.addStream({
    stream: {
      // @ts-ignore
      write: (chunk: LogRecord) => {
        if (chunk.tag === 'device') {
          console.log();
          logWithLevel(chunk);
        }
      },
    },
    type: 'raw',
  });

  return logger;
}

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
