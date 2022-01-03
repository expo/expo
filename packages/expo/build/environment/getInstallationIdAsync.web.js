import { v4 as uuidv4 } from 'uuid';
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
const INSTALLATION_ID_KEY = 'installationId';
let installationId = null;
export default function getInstallationIdAsync() {
    return _getInstallationIdAsync.apply(this, arguments);
};
function _getInstallationIdAsync() {
    _getInstallationIdAsync = _asyncToGenerator(function*() {
        // Already cached value
        if (installationId) {
            return installationId;
        }
        try {
            // No cached value, fetch from persisted storage
            installationId = localStorage.getItem(INSTALLATION_ID_KEY);
            if (installationId) {
                return installationId;
            }
        } catch (error) {
        // If we weren't able to fetch one (for whatever reason)
        // let's create a new one.
        }
        // No persisted value, set the cached value...
        installationId = uuidv4();
        // ...and try to persist it. Ignore the errors.
        try {
            localStorage.setItem(INSTALLATION_ID_KEY, installationId);
        } catch (error1) {
            console.debug('Could not save installation ID in persisted storage, it will get reset.', error1);
        }
        return installationId;
    });
    return _getInstallationIdAsync.apply(this, arguments);
}

//# sourceMappingURL=getInstallationIdAsync.web.js.map