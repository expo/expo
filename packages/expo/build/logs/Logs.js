let _originalConsole;
export function enableExpoCliLogging() {
    if (__DEV__) {
        if (_originalConsole) {
            return;
        }
        _originalConsole = global.console;
        const RemoteConsole = require('./RemoteConsole');
        global.console = RemoteConsole.createRemoteConsole(global.console);
    }
}
export function disableExpoCliLogging() {
    if (__DEV__) {
        if (!_originalConsole) {
            return;
        }
        global.console = _originalConsole;
        _originalConsole = null;
    }
}
//# sourceMappingURL=Logs.js.map