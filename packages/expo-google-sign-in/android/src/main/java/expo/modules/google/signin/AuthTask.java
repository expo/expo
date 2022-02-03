package expo.modules.google.signin;

import expo.modules.core.Promise;

import static expo.modules.google.signin.GoogleSignInModule.ERROR_CONCURRENT_TASK_IN_PROGRESS;

public class AuthTask {
    private Promise mPromise;
    private String mTag;

    public boolean update(Promise promise, String tag) {
        if (mPromise == null) {
            mPromise = promise;
            mTag = tag;
            return true;
        } else {
            promise.reject(ERROR_CONCURRENT_TASK_IN_PROGRESS, "cannot set promise - some async operation is still in progress");
            return false;
        }
    }

    public void resolve(Object value) {
        Promise resolver = mPromise;
        if (resolver == null) return;
        clear();
        resolver.resolve(value);
    }

    public void reject(String code, String message) {
        Promise rejecter = mPromise;
        if (rejecter == null) return;
        clear();
        rejecter.reject(code, "GoogleSignIn." + mTag + ": " + message);
    }

    private void clear() {
        mPromise = null;
        mTag = null;
    }
}
