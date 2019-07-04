package abi34_0_0.host.exp.exponent;

import org.unimodules.core.interfaces.SingletonModule;

import java.util.List;

import abi34_0_0.org.unimodules.core.interfaces.Package;
import abi34_0_0.host.exp.exponent.modules.universal.ExpoModuleRegistryAdapter;

public interface ExponentPackageDelegate {
  ExpoModuleRegistryAdapter getScopedModuleRegistryAdapterForPackages(List<Package> packages, List<SingletonModule> singletonModules);
}
