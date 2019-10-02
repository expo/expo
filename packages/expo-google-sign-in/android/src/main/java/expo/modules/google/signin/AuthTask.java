package expo.modules.google.signin;

import org.unimodules.core.Promise;

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
        if (mPromise == null) return;
        mPromise.resolve(value);
        clear();
    }

    public void reject(String code, String message) {
        if (mPromise == null) return;
        mPromise.reject(code, "GoogleSignIn." + mTag + ": " + message);
        clear();
    }

    private void clear() {
        mPromise = null;
        mTag = null;
    }
}
