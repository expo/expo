package expo.loaders.provider.interfaces;

import java.util.List;

import abi33_0_0.org.unimodules.core.interfaces.Package;

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
