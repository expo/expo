import RemoteConsole from './RemoteConsole';
let _originalConsole;
export function enableExpoCliLogging() {
    if (_originalConsole) {
        return;
    }
    _originalConsole = global.console;
    global.console = RemoteConsole.createRemoteConsole(global.console);
}
export function disableExpoCliLogging() {
    if (!_originalConsole) {
        return;
    }
    global.console = _originalConsole;
    _originalConsole = null;
}
//# sourceMappingURL=Logs.js.map