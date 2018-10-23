package expo.modules.google.signin;

import expo.core.Promise;

import static expo.modules.google.signin.GoogleSignInModule.ERROR_CONCURRENT_TASK_IN_PROGRESS;

public class AuthTask {
    private Promise _promise;
    private String _tag;

    public boolean update(Promise promise, String tag) {
        if (_promise == null) {
            _promise = promise;
            _tag = tag;
            return true;
        } else {
            promise.reject(ERROR_CONCURRENT_TASK_IN_PROGRESS, "cannot set promise - some async operation is still in progress");
            return false;
        }
    }

    public void resolve(Object value) {
        if (_promise == null) return;
        _promise.resolve(value);
        clear();
    }

    public void reject(String code, String message) {
        if (_promise == null) return;
        _promise.reject(code, "GoogleSignIn." + _tag + ": " + message);
        clear();
    }

    private void clear() {
        _promise = null;
        _tag = null;
    }
}
