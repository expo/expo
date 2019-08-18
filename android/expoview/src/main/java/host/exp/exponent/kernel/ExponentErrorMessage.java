// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel;

public class ExponentErrorMessage {

  private static final int MAX_LENGTH = 300;

  private String mUserErrorMessage;
  private final String mDeveloperErrorMessage;

  public ExponentErrorMessage(String userErrorMessage, String developerErrorMessage) {
    this.mUserErrorMessage = userErrorMessage;
    this.mDeveloperErrorMessage = developerErrorMessage;
  }

  public String userErrorMessage() {
    if (mUserErrorMessage != null) {
      return limit(mUserErrorMessage);
    } else {
      return "";
    }
  }

  public String developerErrorMessage() {
    if (mDeveloperErrorMessage != null) {
      return limit(mDeveloperErrorMessage);
    } else {
      return "";
    }
  }

  public static ExponentErrorMessage userErrorMessage(final String errorMessage) {
    return new ExponentErrorMessage(errorMessage, errorMessage);
  }

  public static ExponentErrorMessage developerErrorMessage(final String errorMessage) {
    return new ExponentErrorMessage(null, errorMessage);
  }

  public ExponentErrorMessage addUserErrorMessage(final String errorMessage) {
    mUserErrorMessage = errorMessage;
    return this;
  }

  private String limit(final String s) {
    if (s.length() < MAX_LENGTH) {
      return s;
    } else {
      return s.substring(0, MAX_LENGTH);
    }
  }
}
