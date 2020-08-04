package abi37_0_0.org.unimodules.core.interfaces;

import abi37_0_0.org.unimodules.core.ModuleRegistry;

public interface RegistryLifecycleListener {

  default void onCreate(ModuleRegistry moduleRegistry) {
    // do nothing
  }

  default void onDestroy() {
    // do nothing
  }

}
