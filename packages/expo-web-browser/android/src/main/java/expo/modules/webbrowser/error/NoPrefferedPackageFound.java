package expo.modules.webbrowser.error;

import org.unimodules.core.errors.CodedException;

public class NoPrefferedPackageFound extends CodedException {

  public NoPrefferedPackageFound() {
    super("Cannot determine preferred package without satisfying it.");
  }
}
