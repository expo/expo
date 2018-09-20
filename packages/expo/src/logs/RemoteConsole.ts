import RemoteLogging, { LogEntryFields, LogLevel } from './RemoteLogging';

type ReactConsole = typeof console;

// error(message?: any, ...optionalParams: any[]): void;
// info(message?: any, ...optionalParams: any[]): void;
// log(message?: any, ...optionalParams: any[]): void;
// warn(message?: any, ...optionalParams: any[]): void;
// trace(message?: any, ...optionalParams: any[]): void;
// debug(message?: any, ...optionalParams: any[]): void;
// table(...data: any[]): void;
// disableYellowBox: boolean;
// ignoredYellowBox: string[];

/**
 * Creates a console object that delegates calls to the specified underlying console and also sends
 * the messages to the development environment over a remote connection.
 */
function createRemoteConsole(originalConsole: Console): Console {
  let groupDepth = 0;

  const enhancedConsole: typeof originalConsole = Object.create(originalConsole);

  // https://console.spec.whatwg.org/#debug
  // Don't use a level below "info" because "debug" is intended for messages that shouldn't be shown
  // to the developer
  _defineConsoleLogMethod('debug', 'info');

  // https://console.spec.whatwg.org/#log
  _defineConsoleLogMethod('log', 'info');

  // https://console.spec.whatwg.org/#info
  _defineConsoleLogMethod('info', 'info');

  // https://console.spec.whatwg.org/#warn
  _defineConsoleLogMethod('warn', 'warn');

  // https://console.spec.whatwg.org/#error
  _defineConsoleLogMethod('error', 'error');

  // https://console.spec.whatwg.org/#assert
  enhancedConsole.assert = function assert(condition: unknown, ...data: unknown[]): void {
    if (originalConsole.assert) {
      // @ts-ignore
      originalConsole.assert(!!condition, ...data);
    }

    if (condition) {
      return;
    }

    const assertionMessage = 'Assertion failed';
    if (!data.length) {
      data.push(assertionMessage);
    } else {
      if (typeof data[0] !== 'string') {
        data.unshift(assertionMessage);
      } else {
        data[0] = `${assertionMessage}: ${data[0]}`;
      }
    }

    _enqueueRemoteLog('error', {}, data);
  };

  // https://console.spec.whatwg.org/#group
  enhancedConsole.group = function group(...data: unknown[]): void {
    if (originalConsole.group) {
      // @ts-ignore
      originalConsole.group(...data);
    }

    _enqueueRemoteLog('info', {}, data);
    groupDepth++;
  };

  // https://console.spec.whatwg.org/#groupcollapsed
  enhancedConsole.groupCollapsed = function groupCollapsed(...data: unknown[]): void {
    if (originalConsole.groupCollapsed) {
      // @ts-ignore
      originalConsole.groupCollapsed(...data);
    }

    _enqueueRemoteLog('info', { groupCollapsed: true }, data);
    groupDepth++;
  };

  // https://console.spec.whatwg.org/#groupend
  enhancedConsole.groupEnd = function groupEnd(): void {
    if (originalConsole.groupEnd) {
      originalConsole.groupEnd();
    }

    if (groupDepth > 0) {
      groupDepth--;
    }

    _enqueueRemoteLog('info', { shouldHide: true }, []);
  };

  /**
   * Defines a method in the `console.log()` family on the enhanced console
   * instance
   */
  function _defineConsoleLogMethod(name: keyof typeof console, level: LogLevel): void {
    enhancedConsole[name] = function __expoConsoleLog(...data: unknown[]): void {
      let originalMethod = originalConsole[name];
      if (typeof originalMethod === 'function') {
        originalMethod.apply(originalConsole, data);
      }

      _enqueueRemoteLog(level, {}, data);
    };
  }

  /**
   * Schedules the given log entry to be sent remotely in a safe way that handles all errors. This
   * function is responsible for error handling because the console methods are synchronous but
   * sending log messages is asynchronous, so this code (instead of the console methods) needs to be
   * responsible for asynchronous errors.
   */
  function _enqueueRemoteLog(
    level: LogLevel,
    additionalFields: LogEntryFields,
    data: unknown[]
  ): void {
    RemoteLogging.enqueueRemoteLogAsync(level, { groupDepth, ...additionalFields }, data).catch(
      error => {
        originalConsole.error(
          `There was a problem sending log messages to your development environment`,
          error
        );
      }
    );
  }

  return enhancedConsole;
}

export default {
  createRemoteConsole,
};
