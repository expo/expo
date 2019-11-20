package abi35_0_0.host.exp.exponent;

import java.util.List;

import abi35_0_0.org.unimodules.core.interfaces.Package;
import abi35_0_0.host.exp.exponent.modules.universal.ExpoModuleRegistryAdapter;
import org.unimodules.core.interfaces.SingletonModule;

public interface ExponentPackageDelegate {
  ExpoModuleRegistryAdapter getScopedModuleRegistryAdapterForPackages(List<Package> packages, List<SingletonModule> singletonModules);
}
