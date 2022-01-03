import * as Application from 'expo-application';
import uuidv5 from 'uuid/v5';
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
let installationId;
const UUID_NAMESPACE = '29cc8a0d-747c-5f85-9ff9-f2f16636d963'; // uuidv5(0, "expo")
export default function getInstallationIdAsync() {
    return _getInstallationIdAsync.apply(this, arguments);
};
function _getInstallationIdAsync() {
    _getInstallationIdAsync = _asyncToGenerator(function*() {
        if (installationId) {
            return installationId;
        }
        const identifierForVendor = yield Application.getIosIdForVendorAsync();
        const bundleIdentifier = Application.applicationId;
        // It's unlikely identifierForVendor will be null (it returns null if the
        // device has been restarted but not yet unlocked), but let's handle this
        // case.
        if (identifierForVendor) {
            installationId = uuidv5(`${bundleIdentifier}-${identifierForVendor}`, UUID_NAMESPACE);
        } else {
            const installationTime = yield Application.getInstallationTimeAsync();
            installationId = uuidv5(`${bundleIdentifier}-${installationTime.getTime()}`, UUID_NAMESPACE);
        }
        return installationId;
    });
    return _getInstallationIdAsync.apply(this, arguments);
}

//# sourceMappingURL=getInstallationIdAsync.js.map