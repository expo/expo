package abi40_0_0.org.unimodules.core.errors;

import abi40_0_0.org.unimodules.core.interfaces.CodedThrowable;

public class CurrentActivityNotFoundException extends CodedException implements CodedThrowable {
  public CurrentActivityNotFoundException() {
    super("Current activity not found. Make sure to call this method while your application is in foreground.");
  }

  @Override
  public String getCode() {
    return "E_CURRENT_ACTIVITY_NOT_FOUND";
  }
}
