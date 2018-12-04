package expo.modules.appauth;

import net.openid.appauth.AuthorizationException;

import expo.core.Promise;

public class AuthTask {
  private Promise mPromise;
  private String mTag;

  public boolean update(Promise promise, String tag) {
    if (mPromise == null) {
      mPromise = promise;
      mTag = tag;
      return true;
    } else {
      promise.reject("ERR_APP_AUTH", "cannot set promise - some async operation is still in progress");
      return false;
    }
  }

  public void resolve(Object value) {
    if (mPromise == null) return;
    mPromise.resolve(value);
    clear();
  }

  public void reject(Exception e) {
    if (e instanceof AuthorizationException) {
      AuthorizationException authorizationException = (AuthorizationException) e;
      this.reject(String.valueOf(authorizationException.code), authorizationException.getLocalizedMessage());
    } else {
      this.reject("ERR_APP_AUTH", e.getLocalizedMessage());
    }
  }

  public void reject(String code, String message) {
    if (mPromise == null) return;
    mPromise.reject(code, "ExpoAppAuth." + mTag + ": " + message);
    clear();
  }

  private void clear() {
    mPromise = null;
    mTag = null;
  }
}
