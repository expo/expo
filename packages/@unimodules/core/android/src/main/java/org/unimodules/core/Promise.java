package org.unimodules.core;

import org.unimodules.core.interfaces.CodedThrowable;

public interface Promise {
  String UNKNOWN_ERROR = "E_UNKNOWN_ERROR";

  void resolve(Object value);

  void reject(String code, String message, Throwable e);

  // Obsolete methods, however nice-to-have when porting React Native modules to Expo modules.
  default void reject(Throwable e) {
    if (e instanceof CodedThrowable) {
      CodedThrowable codedThrowable = (CodedThrowable) e;
      reject(codedThrowable.getCode(), codedThrowable.getMessage(), e);
    } else {
      reject(UNKNOWN_ERROR, e);
    }
  }

  default void reject(String code, String message) {
    reject(code, message, null);
  }

  default void reject(String code, Throwable e) {
    reject(code, e.getMessage(), e);
  }
}
