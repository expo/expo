package abi39_0_0.expo.modules.webbrowser.error;

import abi39_0_0.org.unimodules.core.errors.CodedException;

public class NoPreferredPackageFound extends CodedException {

  public NoPreferredPackageFound(String message) {
    super(message);
  }

  @Override
  public String getCode() {
    return "PREFERRED_PACKAGE_NOT_FOUND";
  }
}
