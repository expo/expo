import bunyan from '@expo/bunyan';
import path from 'path';

import * as Log from '../log';
import { EXPO_DEBUG } from '../utils/env';

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

    // const stream: bunyan.Stream = {
    //   level: EXPO_DEBUG ? 'debug' : 'info',
    //   stream: {
    //     write(chunk: any) {
    //       if (chunk.level === bunyan.INFO) {
    //         Log.log(chunk.msg);
    //       } else if (chunk.level === bunyan.WARN) {
    //         Log.warn(chunk.msg);
    //       } else if (chunk.level === bunyan.DEBUG) {
    //         Log.debug(chunk.msg);
    //       } else if (chunk.level >= bunyan.ERROR) {
    //         Log.error(chunk.msg);
    //       }
    //     },
    //   },
    //   type: 'raw',
    // };
    // Logger.notifications.addStream(stream);
    // Logger.global.addStream(stream);
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
