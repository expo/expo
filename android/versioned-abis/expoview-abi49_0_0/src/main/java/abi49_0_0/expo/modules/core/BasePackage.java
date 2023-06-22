package abi49_0_0.expo.modules.core;

import android.content.Context;

import abi49_0_0.expo.modules.core.interfaces.ApplicationLifecycleListener;
import abi49_0_0.expo.modules.core.interfaces.InternalModule;
import abi49_0_0.expo.modules.core.interfaces.Package;
import abi49_0_0.expo.modules.core.interfaces.ReactActivityHandler;
import abi49_0_0.expo.modules.core.interfaces.ReactActivityLifecycleListener;
import abi49_0_0.expo.modules.core.interfaces.ReactNativeHostHandler;
import expo.modules.core.interfaces.SingletonModule;

import java.util.Collections;
import java.util.List;

// This class should not be used. Implement abi49_0_0.expo.modules.core.interfaces.Package instead of extending this class
// Remove once no one extends it.
public class BasePackage implements Package {
  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Collections.emptyList();
  }

  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.emptyList();
  }

  @Override
  public List<ViewManager> createViewManagers(Context context) {
    return Collections.emptyList();
  }

  @Override
  public List<SingletonModule> createSingletonModules(Context context) {
    return Collections.emptyList();
  }

  @Override
  public List<ApplicationLifecycleListener> createApplicationLifecycleListeners(Context context) {
    return Collections.emptyList();
  }

  @Override
  public List<? extends ReactNativeHostHandler> createReactNativeHostHandlers(Context context) {
    return Collections.emptyList();
  }

  @Override
  public List<ReactActivityLifecycleListener> createReactActivityLifecycleListeners(Context activityContext) {
    return Collections.emptyList();
  }

  @Override
  public List<ReactActivityHandler> createReactActivityHandlers(Context activityContext) {
    return Collections.emptyList();
  }
}
