package expo.modules.webbrowser.error;

import expo.errors.CodedException;

public class PackageManagerNotFoundException extends CodedException {

  public PackageManagerNotFoundException() {
    super("Package Manager not found!");
  }
}
