package org.unimodules.apploader;

import java.util.List;

import org.unimodules.core.interfaces.Package;

public interface AppLoaderPackagesProviderInterface<ReactPackageType> {
  /**
   * Returns a list of React Native packages to load.
   */
  List<ReactPackageType> getPackages();

  /**
   * Returns a list of Expo packages to load.
   */
  List<Package> getExpoPackages();
}
