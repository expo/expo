import RemoteConsole from './RemoteConsole';

let _originalConsole: typeof console | null;

function enableExpoCliLogging(): void {
  if (_originalConsole) {
    return;
  }

  _originalConsole = global.console;
  global.console = RemoteConsole.createRemoteConsole(global.console);
}

function disableExpoCliLogging(): void {
  if (!_originalConsole) {
    return;
  }

  global.console = _originalConsole;
  _originalConsole = null;
}

export default {
  enableExpoCliLogging,
  disableExpoCliLogging,
};
