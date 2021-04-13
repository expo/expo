let _originalConsole: typeof console | null;

export function enableExpoCliLogging(): void {
  if (__DEV__) {
    if (_originalConsole) {
      return;
    }

    _originalConsole = global.console;
    const RemoteConsole = require('./RemoteConsole');
    global.console = RemoteConsole.createRemoteConsole(global.console);
  }
}

export function disableExpoCliLogging(): void {
  if (__DEV__) {
    if (!_originalConsole) {
      return;
    }

    global.console = _originalConsole;
    _originalConsole = null;
  }
}
