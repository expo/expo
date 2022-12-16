declare module '@expo/bunyan' {
  import { EventEmitter } from 'events';

  class Logger extends EventEmitter {
    constructor(options: Logger.LoggerOptions);
    addStream(stream: Logger.Stream): void;
    addSerializers(serializers: Logger.Serializers): void;
    child(options: object, simple?: boolean): Logger;
    reopenFileStreams(): void;

    level(): number;
    level(value: Logger.LogLevel): void;
    levels(): number[];
    levels(name: number | string): number;
    levels(name: number | string, value: Logger.LogLevel): void;

    fields: any;
    src: boolean;

    /**
     * Returns a boolean: is the `trace` level enabled?
     *
     * This is equivalent to `log.isTraceEnabled()` or `log.isEnabledFor(TRACE)` in log4j.
     */
    trace(): boolean;

    /**
     * Special case to log an `Error` instance to the record.
     * This adds an `err` field with exception details
     * (including the stack) and sets `msg` to the exception
     * message or you can specify the `msg`.
     */
    trace(error: Error, ...params: any[]): void;

    /**
     * The first field can optionally be a "fields" object, which
     * is merged into the log record.
     *
     * To pass in an Error *and* other fields, use the `err`
     * field name for the Error instance.
     */
    trace(obj: Object, ...params: any[]): void;

    /**
     * For xdl
     */
    trace(...params: any[]): void;

    /**
     * Returns a boolean: is the `debug` level enabled?
     *
     * This is equivalent to `log.isDebugEnabled()` or `log.isEnabledFor(DEBUG)` in log4j.
     */
    debug(): boolean;

    /**
     * Special case to log an `Error` instance to the record.
     * This adds an `err` field with exception details
     * (including the stack) and sets `msg` to the exception
     * message or you can specify the `msg`.
     */
    debug(error: Error, ...params: any[]): void;

    /**
     * The first field can optionally be a "fields" object, which
     * is merged into the log record.
     *
     * To pass in an Error *and* other fields, use the `err`
     * field name for the Error instance.
     */
    debug(obj: Object, ...params: any[]): void;

    /**
     * For xdl
     */
    debug(...params: any[]): void;

    /**
     * Returns a boolean: is the `info` level enabled?
     *
     * This is equivalent to `log.isInfoEnabled()` or `log.isEnabledFor(INFO)` in log4j.
     */
    info(): boolean;

    /**
     * Special case to log an `Error` instance to the record.
     * This adds an `err` field with exception details
     * (including the stack) and sets `msg` to the exception
     * message or you can specify the `msg`.
     */
    info(error: Error, ...params: any[]): void;

    /**
     * The first field can optionally be a "fields" object, which
     * is merged into the log record.
     *
     * To pass in an Error *and* other fields, use the `err`
     * field name for the Error instance.
     */
    info(obj: Object, ...params: any[]): void;

    /**
     * For xdl
     */
    info(...params: any[]): void;

    /**
     * Returns a boolean: is the `warn` level enabled?
     *
     * This is equivalent to `log.isWarnEnabled()` or `log.isEnabledFor(WARN)` in log4j.
     */
    warn(): boolean;

    /**
     * Special case to log an `Error` instance to the record.
     * This adds an `err` field with exception details
     * (including the stack) and sets `msg` to the exception
     * message or you can specify the `msg`.
     */
    warn(error: Error, ...params: any[]): void;

    /**
     * The first field can optionally be a "fields" object, which
     * is merged into the log record.
     *
     * To pass in an Error *and* other fields, use the `err`
     * field name for the Error instance.
     */
    warn(obj: Object, ...params: any[]): void;

    /**
     * For xdl
     */
    warn(...params: any[]): void;

    /**
     * Returns a boolean: is the `error` level enabled?
     *
     * This is equivalent to `log.isErrorEnabled()` or `log.isEnabledFor(ERROR)` in log4j.
     */
    error(): boolean;

    /**
     * Special case to log an `Error` instance to the record.
     * This adds an `err` field with exception details
     * (including the stack) and sets `msg` to the exception
     * message or you can specify the `msg`.
     */
    error(error: Error, ...params: any[]): void;

    /**
     * The first field can optionally be a "fields" object, which
     * is merged into the log record.
     *
     * To pass in an Error *and* other fields, use the `err`
     * field name for the Error instance.
     */
    error(obj: Object, ...params: any[]): void;

    /**
     * For xdl
     */
    error(...params: any[]): void;

    /**
     * Returns a boolean: is the `fatal` level enabled?
     *
     * This is equivalent to `log.isFatalEnabled()` or `log.isEnabledFor(FATAL)` in log4j.
     */
    fatal(): boolean;

    /**
     * Special case to log an `Error` instance to the record.
     * This adds an `err` field with exception details
     * (including the stack) and sets `msg` to the exception
     * message or you can specify the `msg`.
     */
    fatal(error: Error, ...params: any[]): void;

    /**
     * The first field can optionally be a "fields" object, which
     * is merged into the log record.
     *
     * To pass in an Error *and* other fields, use the `err`
     * field name for the Error instance.
     */
    fatal(obj: Object, ...params: any[]): void;

    /**
     * For xdl
     */
    fatal(...params: any[]): void;
  }

  namespace Logger {
    const TRACE: number;
    const DEBUG: number;
    const INFO: number;
    const WARN: number;
    const ERROR: number;
    const FATAL: number;

    type LogLevelString = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    type LogLevel = LogLevelString | number;

    const levelFromName: { [name in LogLevelString]: number };
    const nameFromLevel: { [level: number]: string };

    const stdSerializers: StdSerializers;

    function createLogger(options: LoggerOptions): Logger;

    function safeCycles(): (key: string, value: any) => any;

    function resolveLevel(value: LogLevel): number;

    type RawStream = { write: (record: any) => void };

    interface Stream {
      type?: string;
      level?: LogLevel;
      path?: string;
      stream?: NodeJS.WritableStream | RawStream;
      closeOnExit?: boolean;
      period?: string;
      count?: number;
      name?: string;
      reemitErrorEvents?: boolean;
    }

    interface LoggerOptions {
      name: string;
      streams?: Stream[];
      level?: LogLevel;
      stream?: NodeJS.WritableStream;
      serializers?: Serializers;
      src?: boolean;
      [custom: string]: any;
    }

    type Serializer = (input: any) => any;

    interface Serializers {
      [key: string]: Serializer;
    }

    interface StdSerializers extends Serializers {
      err: Serializer;
      res: Serializer;
      req: Serializer;
    }

    interface RingBufferOptions {
      limit?: number;
    }

    class RingBuffer extends EventEmitter {
      constructor(options: RingBufferOptions);

      writable: boolean;
      records: any[];

      write(record: any): boolean;
      end(record?: any): void;
      destroy(): void;
      destroySoon(): void;
    }

    interface RotatingFileStreamOptions {
      path: string;
      count?: number;
      period?: string;
    }

    class RotatingFileStream extends EventEmitter {
      constructor(options: RotatingFileStreamOptions);

      writable: boolean;
      periodNum: number;
      periodScope: string;
      stream: any;
      rotQueue: any[];
      rotating: boolean;

      write(record: any): boolean;
      end(record?: any): void;
      destroy(): void;
      destroySoon(): void;
      rotate(): void;
    }
  }

  export = Logger;
}
