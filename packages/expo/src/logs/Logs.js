// @flow

import RemoteConsole from './RemoteConsole';

let _originalConsole: ?typeof console;

function enableXDELogging(): void {
  if (_originalConsole) {
    return;
  }

  _originalConsole = global.console;
  global.console = RemoteConsole.createRemoteConsole(global.console);
}

function disableXDELogging(): void {
  if (!_originalConsole) {
    return;
  }

  global.console = _originalConsole;
  _originalConsole = null;
}

export default {
  enableXDELogging,
  disableXDELogging,
};
