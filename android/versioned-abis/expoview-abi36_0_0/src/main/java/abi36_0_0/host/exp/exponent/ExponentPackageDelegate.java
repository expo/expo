package abi36_0_0.host.exp.exponent;

import java.util.List;

import abi36_0_0.org.unimodules.core.interfaces.Package;
import org.unimodules.core.interfaces.SingletonModule;
import abi36_0_0.host.exp.exponent.modules.universal.ExpoModuleRegistryAdapter;

public interface ExponentPackageDelegate {
  ExpoModuleRegistryAdapter getScopedModuleRegistryAdapterForPackages(List<Package> packages, List<SingletonModule> singletonModules);
}
