package org.unimodules.adapters.react;

import android.os.Bundle;

import com.facebook.react.bridge.Arguments;

import java.util.List;

import javax.annotation.Nullable;

import org.unimodules.core.Promise;

/**
 * Decorator for {@link com.facebook.react.bridge.Promise},
 * so we don't have to implement these inline in {@link NativeModulesProxy}.
 */
/* package */ class PromiseWrapper extends Promise {
  private com.facebook.react.bridge.Promise mPromise;

  /* package */ PromiseWrapper(com.facebook.react.bridge.Promise promise) {
    super();
    mPromise = promise;
  }

  public void resolve(@Nullable Object value) {
    if (value instanceof Bundle) {
      mPromise.resolve(Arguments.fromBundle((Bundle) value));
    } else if (value instanceof List) {
      mPromise.resolve(Arguments.fromList((List) value));
    } else {
      mPromise.resolve(value);
    }
  }

  public void reject(String code, String message, Throwable e) {
    mPromise.reject(code, message, e);
  }
}
