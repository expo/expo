package abi45_0_0.expo.modules.webbrowser.error;

import abi45_0_0.expo.modules.core.errors.CodedException;

public class NoPreferredPackageFound extends CodedException {

  public NoPreferredPackageFound(String message) {
    super(message);
  }

  @Override
  public String getCode() {
    return "PREFERRED_PACKAGE_NOT_FOUND";
  }
}
