package expo.modules.appauth;

import net.openid.appauth.AuthorizationException;

import expo.core.Promise;

public class AuthTask {
    private Promise _promise;
    private String _tag;

    public boolean update(Promise promise, String tag) {
        if (_promise == null) {
            _promise = promise;
            _tag = tag;
            return true;
        } else {
            promise.reject("E_APP_AUTH", "cannot set promise - some async operation is still in progress");
            return false;
        }
    }

    public void resolve(Object value) {
        if (_promise == null) return;
        _promise.resolve(value);
        clear();
    }

    public void reject(Exception e) {
        if (e instanceof AuthorizationException) {
            AuthorizationException authorizationException = (AuthorizationException)e;
            this.reject(String.valueOf(authorizationException.code), authorizationException.getLocalizedMessage());
        } else {
          this.reject("E_APP_AUTH", e.getLocalizedMessage());
        }
    }

    public void reject(String code, String message) {
        if (_promise == null) return;
        _promise.reject(code, "ExpoAppAuth." + _tag + ": " + message);
        clear();
    }

    private void clear() {
        _promise = null;
        _tag = null;
    }
}
