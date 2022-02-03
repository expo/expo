package abi43_0_0.org.unimodules.adapters.react;

import java.util.List;

import abi43_0_0.expo.modules.core.interfaces.Package;
import expo.modules.core.interfaces.SingletonModule;

/**
 * @deprecated use {@link abi43_0_0.expo.modules.adapters.react.ReactModuleRegistryProvider} instead.
 */
@Deprecated
public class ReactModuleRegistryProvider extends abi43_0_0.expo.modules.adapters.react.ReactModuleRegistryProvider {
  public ReactModuleRegistryProvider(List<Package> initialPackages) {
    super(initialPackages);
  }

  public ReactModuleRegistryProvider(List<Package> initialPackages, List<SingletonModule> singletonModules) {
    super(initialPackages, singletonModules);
  }
}
