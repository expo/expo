import bunyan from '@expo/bunyan';

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
};

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

let _logger: bunyan | undefined;

export function getLogger(): bunyan {
  if (!_logger) {
    _logger = Logger.child({
      type: 'project',
      // project: path.resolve(projectRoot),
    });
  }

  return _logger;
}
