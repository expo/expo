package abi42_0_0.expo.modules.webbrowser.error;

import abi42_0_0.org.unimodules.core.errors.CodedException;

public class PackageManagerNotFoundException extends CodedException {

  public PackageManagerNotFoundException() {
    super("Package Manager not found!");
  }
}
