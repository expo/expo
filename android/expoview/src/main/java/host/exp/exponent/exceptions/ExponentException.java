// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.exceptions;

public abstract class ExponentException extends Exception {

  private final Exception mOriginalException;

  public ExponentException(final Exception originalException) {
    mOriginalException = originalException;
  }

  abstract public String toString();

  public Exception originalException() {
    return mOriginalException;
  }

  public String originalExceptionMessage() {
    if (mOriginalException != null) {
      return mOriginalException.toString();
    } else {
      return toString();
    }
  }
}
