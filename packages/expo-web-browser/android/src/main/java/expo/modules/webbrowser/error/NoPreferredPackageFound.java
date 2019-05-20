package expo.modules.webbrowser.error;

import org.unimodules.core.errors.CodedException;

public class NoPreferredPackageFound extends CodedException {

  public NoPreferredPackageFound(String message) {
    super(message);
  }

  @Override
  public String getCode() {
    return "PREFERRED_PACKAGE_NOT_FOUND";
  }
}
