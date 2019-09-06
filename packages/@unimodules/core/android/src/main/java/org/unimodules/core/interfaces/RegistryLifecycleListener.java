package org.unimodules.core.interfaces;

import org.unimodules.core.ModuleRegistry;

public interface RegistryLifecycleListener {

  default void onCreate(ModuleRegistry moduleRegistry, String appId) {
    // do nothing
  }

  default void onDestroy() {
    // do nothing
  }

}
