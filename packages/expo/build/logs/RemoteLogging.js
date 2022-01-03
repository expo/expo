import Constants from 'expo-constants';
import { Platform } from 'expo-modules-core';
import { EventEmitter } from 'fbemitter';
import invariant from 'invariant';
import { v4 as uuidv4 } from 'uuid';
import getInstallationIdAsync from '../environment/getInstallationIdAsync';
import LogSerialization from './LogSerialization';
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _asyncToGenerator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
function _defineProperty(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _objectSpread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _defineProperty(target, key, source[key]);
        });
    }
    return target;
}
const _sessionId = uuidv4();
const _logQueue = [];
const _transportEventEmitter = new EventEmitter();
let _logCounter = 0;
let _isSendingLogs = false;
let _completionPromise = null;
let _resolveCompletion = null;
function enqueueRemoteLogAsync(level, additionalFields, data) {
    return _enqueueRemoteLogAsync.apply(this, arguments);
}
function _enqueueRemoteLogAsync() {
    _enqueueRemoteLogAsync = _asyncToGenerator(function*(level, additionalFields, data) {
        if (_isReactNativeWarning(data)) {
            // Remove the stack trace from the warning message since we'll capture our own
            if (data.length === 0) {
                throw new Error(`Warnings must include log arguments`);
            }
            const warning = data[0];
            if (typeof warning !== 'string') {
                throw new TypeError(`The log argument for a warning must be a string`);
            }
            const lines = warning.split('\n');
            if (lines.length > 1 && /^\s+in /.test(lines[1])) {
                data[0] = lines[0];
            }
        }
        const { body , includesStack  } = yield LogSerialization.serializeLogDataAsync(data, level);
        _logQueue.push(_objectSpread({
            count: _logCounter++,
            level,
            body,
            includesStack
        }, additionalFields));
        // Send the logs asynchronously (system errors are emitted with transport error events) and throw an uncaught error
        _sendRemoteLogsAsync().catch((error)=>{
            setImmediate(()=>{
                throw error;
            });
        });
    });
    return _enqueueRemoteLogAsync.apply(this, arguments);
}
function _sendRemoteLogsAsync() {
    return __sendRemoteLogsAsync.apply(this, arguments);
}
function __sendRemoteLogsAsync() {
    __sendRemoteLogsAsync = _asyncToGenerator(function*() {
        var ref, ref1, ref2, ref3;
        if (_isSendingLogs || !_logQueue.length) {
            return;
        }
        // Our current transport policy is to send all of the pending log messages in one batch. If we opt
        // for another policy (ex: throttling) this is where to to implement it.
        const batch = _logQueue.splice(0);
        var ref4;
        const logUrl = (ref4 = (ref = Constants.manifest) === null || ref === void 0 ? void 0 : ref.logUrl) !== null && ref4 !== void 0 ? ref4 : (ref1 = Constants.manifest2) === null || ref1 === void 0 ? void 0 : (ref2 = ref1.extra) === null || ref2 === void 0 ? void 0 : (ref3 = ref2.expoGo) === null || ref3 === void 0 ? void 0 : ref3.logUrl;
        if (typeof logUrl !== 'string') {
            throw new Error('The Expo project manifest must specify `logUrl`');
        }
        _isSendingLogs = true;
        try {
            yield _sendNextLogBatchAsync(batch, logUrl);
        } finally{
            _isSendingLogs = false;
        }
        if (_logQueue.length) {
            return _sendRemoteLogsAsync();
        } else if (_resolveCompletion) {
            _resolveCompletion();
        }
    });
    return __sendRemoteLogsAsync.apply(this, arguments);
}
function _sendNextLogBatchAsync(batch, logUrl) {
    return __sendNextLogBatchAsync.apply(this, arguments);
}
function __sendNextLogBatchAsync() {
    __sendNextLogBatchAsync = _asyncToGenerator(function*(batch, logUrl) {
        let response;
        const headers = {
            'Content-Type': 'application/json',
            Connection: 'keep-alive',
            'Proxy-Connection': 'keep-alive',
            Accept: 'application/json',
            'Device-Id': yield getInstallationIdAsync(),
            'Session-Id': _sessionId,
            'Expo-Platform': Platform.OS
        };
        if (Constants.deviceName) {
            headers['Device-Name'] = Constants.deviceName;
        }
        try {
            response = yield fetch(logUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(batch)
            });
        } catch (error) {
            _transportEventEmitter.emit('error', {
                error
            });
            return;
        }
        const success = response.status >= 200 && response.status < 300;
        if (!success) {
            _transportEventEmitter.emit('error', {
                error: new Error(`An HTTP error occurred when sending remote logs`),
                response
            });
        }
    });
    return __sendNextLogBatchAsync.apply(this, arguments);
}
function addTransportErrorListener(listener) {
    return _transportEventEmitter.addListener('error', listener);
}
function _isReactNativeWarning(data) {
    // NOTE: RN does the same thing internally for YellowBox
    const message = data[0];
    return data.length === 1 && typeof message === 'string' && message.startsWith('Warning: ');
}
export default {
    enqueueRemoteLogAsync,
    addTransportErrorListener
};
/**
 * Returns a promise that resolves when all entries in the log queue have been sent. This method is
 * intended for testing only.
 */ export function __waitForEmptyLogQueueAsync() {
    if (_completionPromise) {
        return _completionPromise;
    }
    if (!_isSendingLogs && !_logQueue.length) {
        return Promise.resolve();
    }
    _completionPromise = new Promise((resolve)=>{
        _resolveCompletion = ()=>{
            invariant(!_isSendingLogs, `Must not be sending logs at completion`);
            invariant(!_logQueue.length, `Log queue must be empty at completion`);
            _completionPromise = null;
            _resolveCompletion = null;
            resolve();
        };
    });
    return _completionPromise;
}

//# sourceMappingURL=RemoteLogging.js.map