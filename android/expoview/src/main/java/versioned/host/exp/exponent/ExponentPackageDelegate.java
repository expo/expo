package versioned.host.exp.exponent;

import java.util.List;

import org.unimodules.core.interfaces.Package;
import org.unimodules.core.interfaces.SingletonModule;
import versioned.host.exp.exponent.modules.universal.ExpoModuleRegistryAdapter;

public interface ExponentPackageDelegate {
  ExpoModuleRegistryAdapter getScopedModuleRegistryAdapterForPackages(List<Package> packages, List<SingletonModule> singletonModules);
}
