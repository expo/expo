package abi41_0_0.host.exp.exponent.modules.universal;

import abi41_0_0.com.facebook.react.bridge.NativeModule;
import abi41_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi41_0_0.com.facebook.react.uimanager.ViewManager;

import java.util.List;
import java.util.Map;

import expo.modules.manifests.core.Manifest;
import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.utils.ScopedContext;

public interface ScopedModuleRegistryAdapter {
  List<ViewManager> createViewManagers(ReactApplicationContext reactContext);
  List<NativeModule> createNativeModules(ScopedContext scopedContext, ExperienceKey experienceKey, Map<String, Object> experienceProperties, Manifest manifest, List<NativeModule> otherModules);
}
