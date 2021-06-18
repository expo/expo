package abi40_0_0.host.exp.exponent.modules.universal;

import abi40_0_0.com.facebook.react.bridge.NativeModule;
import abi40_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi40_0_0.com.facebook.react.uimanager.ViewManager;

import java.util.List;
import java.util.Map;

import expo.modules.updates.manifest.raw.RawManifest;
import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.utils.ScopedContext;

public interface ScopedModuleRegistryAdapter {
  List<ViewManager> createViewManagers(ReactApplicationContext reactContext);
  List<NativeModule> createNativeModules(ScopedContext scopedContext, ExperienceKey experienceKey, Map<String, Object> experienceProperties, RawManifest manifest, String experienceStableLegacyId, List<NativeModule> otherModules);
}
