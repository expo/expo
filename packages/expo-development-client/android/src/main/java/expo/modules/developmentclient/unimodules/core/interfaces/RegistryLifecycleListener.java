package expo.modules.developmentclient.unimodules.core.interfaces;

import expo.modules.developmentclient.unimodules.core.ModuleRegistry;

public interface RegistryLifecycleListener {

  default void onCreate(ModuleRegistry moduleRegistry) {
    // do nothing
  }

  default void onDestroy() {
    // do nothing
  }

}
