package abi46_0_0.host.exp.exponent.modules.api.reanimated;

import static abi46_0_0.com.facebook.react.bridge.ReactMarkerConstants.CREATE_UI_MANAGER_MODULE_END;
import static abi46_0_0.com.facebook.react.bridge.ReactMarkerConstants.CREATE_UI_MANAGER_MODULE_START;

import abi46_0_0.com.facebook.react.ReactApplication;
import abi46_0_0.com.facebook.react.ReactInstanceManager;
import abi46_0_0.com.facebook.react.ReactPackage;
import abi46_0_0.com.facebook.react.TurboReactPackage;
import abi46_0_0.com.facebook.react.bridge.NativeModule;
import abi46_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi46_0_0.com.facebook.react.bridge.ReactMarker;
import abi46_0_0.com.facebook.react.module.annotations.ReactModule;
import abi46_0_0.com.facebook.react.module.model.ReactModuleInfo;
import abi46_0_0.com.facebook.react.module.model.ReactModuleInfoProvider;
import abi46_0_0.com.facebook.react.turbomodule.core.interfaces.TurboModule;
import abi46_0_0.com.facebook.react.uimanager.ReanimatedUIManager;
import abi46_0_0.com.facebook.react.uimanager.UIManagerModule;
import abi46_0_0.com.facebook.systrace.Systrace;
import java.util.HashMap;
import java.util.Map;

public class ReanimatedPackage extends TurboReactPackage implements ReactPackage {

  @Override
  public NativeModule getModule(String name, ReactApplicationContext reactContext) {
    if (name.equals(ReanimatedModule.NAME)) {
      return new ReanimatedModule(reactContext);
    }
    if (name.equals(ReanimatedUIManager.NAME)) {
      return createUIManager(reactContext);
    }
    return null;
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    Class<? extends NativeModule>[] moduleList =
        new Class[] {
          ReanimatedModule.class, ReanimatedUIManager.class,
        };

    final Map<String, ReactModuleInfo> reactModuleInfoMap = new HashMap<>();
    for (Class<? extends NativeModule> moduleClass : moduleList) {
      ReactModule reactModule = moduleClass.getAnnotation(ReactModule.class);

      reactModuleInfoMap.put(
          reactModule.name(),
          new ReactModuleInfo(
              reactModule.name(),
              moduleClass.getName(),
              true,
              reactModule.needsEagerInit(),
              reactModule.hasConstants(),
              reactModule.isCxxModule(),
              TurboModule.class.isAssignableFrom(moduleClass)));
    }

    return new ReactModuleInfoProvider() {
      @Override
      public Map<String, ReactModuleInfo> getReactModuleInfos() {
        return reactModuleInfoMap;
      }
    };
  }

  private UIManagerModule createUIManager(final ReactApplicationContext reactContext) {
    ReactMarker.logMarker(CREATE_UI_MANAGER_MODULE_START);
    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "createUIManagerModule");
    final ReactInstanceManager reactInstanceManager = getReactInstanceManager(reactContext);
    int minTimeLeftInFrameForNonBatchedOperationMs = -1;
    try {
      return new ReanimatedUIManager(
          reactContext,
          reactInstanceManager.getOrCreateViewManagers(reactContext),
          minTimeLeftInFrameForNonBatchedOperationMs);
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
      ReactMarker.logMarker(CREATE_UI_MANAGER_MODULE_END);
    }
  }

  /**
   * Get the {@link ReactInstanceManager} used by this app. By default, assumes {@link
   * ReactApplicationContext#getApplicationContext()} is an instance of {@link ReactApplication} and
   * calls {@link ReactApplication#getReactNativeHost().getReactInstanceManager()}. Override this
   * method if your application class does not implement {@code ReactApplication} or you simply have
   * a different mechanism for storing a {@code ReactInstanceManager}, e.g. as a static field
   * somewhere.
   */
  public ReactInstanceManager getReactInstanceManager(ReactApplicationContext reactContext) {
    return ((ReactApplication) reactContext.getApplicationContext())
        .getReactNativeHost()
        .getReactInstanceManager();
  }
}
