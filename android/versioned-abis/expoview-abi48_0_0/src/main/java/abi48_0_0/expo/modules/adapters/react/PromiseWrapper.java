package abi48_0_0.expo.modules.adapters.react;

import android.os.Bundle;

import abi48_0_0.com.facebook.react.bridge.Arguments;

import abi48_0_0.expo.modules.core.Promise;

import java.util.List;

import javax.annotation.Nullable;

/**
 * Decorator for {@link abi48_0_0.com.facebook.react.bridge.Promise},
 * so we don't have to implement these inline in {@link NativeModulesProxy}.
 */
/* package */ class PromiseWrapper implements Promise {
  private abi48_0_0.com.facebook.react.bridge.Promise mPromise;

  /* package */ PromiseWrapper(abi48_0_0.com.facebook.react.bridge.Promise promise) {
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
