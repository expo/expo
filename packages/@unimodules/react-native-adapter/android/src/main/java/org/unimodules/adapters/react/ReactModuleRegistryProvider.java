package org.unimodules.adapters.react;

import java.util.List;

import expo.modules.core.interfaces.Package;
import expo.modules.core.interfaces.SingletonModule;

/**
 * @deprecated use {@link expo.modules.adapters.react.ReactModuleRegistryProvider} instead.
 */
@Deprecated
public class ReactModuleRegistryProvider extends expo.modules.adapters.react.ReactModuleRegistryProvider {
  public ReactModuleRegistryProvider(List<Package> initialPackages) {
    super(initialPackages);
  }

  public ReactModuleRegistryProvider(List<Package> initialPackages, List<SingletonModule> singletonModules) {
    super(initialPackages, singletonModules);
  }
}
