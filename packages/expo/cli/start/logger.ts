import bunyan from '@expo/bunyan';
import path from 'path';

import * as Log from '../log';

class ConsoleRawStream {
  write(record: any) {
    if (record.level < bunyan.DEBUG) {
      Log.debug(record);
    } else if (record.level < bunyan.INFO) {
      Log.log(record);
    } else if (record.level < bunyan.WARN) {
      Log.log(record);
    } else if (record.level < bunyan.ERROR) {
      Log.warn(record);
    } else {
      Log.error(record);
    }
  }
}

export const LoadingEvent = {
  START_LOADING: 'START_LOADING',
  STOP_LOADING: 'STOP_LOADING',
  START_PROGRESS_BAR: 'START_PROGRESS_BAR',
  TICK_PROGRESS_BAR: 'TICK_PROGRESS_BAR',
  STOP_PROGRESS_BAR: 'STOP_PROGRESS_BAR',
};

const logger = bunyan.createLogger({
  name: 'expo',
  serializers: bunyan.stdSerializers,
  streams:
    process.env.EXPO_RAW_LOG && process.env.NODE_ENV !== 'production'
      ? [
          {
            type: 'raw',
            stream: new ConsoleRawStream(),
            closeOnExit: false,
            level: 'debug',
          },
        ]
      : [],
});

export type LogStream = bunyan.Stream;

export const Logger = {
  child: (options: object) => logger.child(options),
  notifications: logger.child({ type: 'notifications' }),
  global: logger.child({ type: 'global' }),
  DEBUG: bunyan.DEBUG,
  INFO: bunyan.INFO,
  WARN: bunyan.WARN,
  ERROR: bunyan.ERROR,
};

const _projectRootToLogger: { [projectRoot: string]: bunyan } = {};

function _getLogger(projectRoot: string): bunyan {
  let logger = _projectRootToLogger[projectRoot];
  if (!logger) {
    logger = Logger.child({
      type: 'project',
      project: path.resolve(projectRoot),
    });
    _projectRootToLogger[projectRoot] = logger;
  }

  return logger;
}

export type LogTag = 'expo' | 'metro' | 'device';
export type LogFields = {
  tag: LogTag;
  issueId?: string;
  issueCleared?: boolean;
  includesStack?: boolean;
  deviceId?: string;
  deviceName?: string;
  groupDepth?: number;
  shouldHide?: boolean;
  _expoEventType?: 'TUNNEL_READY';
};

export function getLogger(projectRoot: string): bunyan {
  return _getLogger(projectRoot);
}
