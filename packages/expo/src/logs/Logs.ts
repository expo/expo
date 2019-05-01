import RemoteConsole from './RemoteConsole';

let _originalConsole: typeof console | null;

export function enableExpoCliLogging(): void {
  if (_originalConsole) {
    return;
  }

  _originalConsole = global.console;
  global.console = RemoteConsole.createRemoteConsole(global.console);
}

export function disableExpoCliLogging(): void {
  if (!_originalConsole) {
    return;
  }

  global.console = _originalConsole;
  _originalConsole = null;
}
