package versioned.host.exp.exponent;

import java.util.List;

import expo.modules.core.interfaces.Package;
import expo.modules.core.interfaces.SingletonModule;
import versioned.host.exp.exponent.modules.universal.ExpoModuleRegistryAdapter;

public interface ExponentPackageDelegate {
  ExpoModuleRegistryAdapter getScopedModuleRegistryAdapterForPackages(List<Package> packages, List<SingletonModule> singletonModules);
}
