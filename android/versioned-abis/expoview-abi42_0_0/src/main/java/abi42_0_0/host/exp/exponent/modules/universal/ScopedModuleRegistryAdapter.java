package abi42_0_0.host.exp.exponent.modules.universal;

import abi42_0_0.com.facebook.react.bridge.NativeModule;
import abi42_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi42_0_0.com.facebook.react.uimanager.ViewManager;

import org.json.JSONObject;

import java.util.List;
import java.util.Map;

import expo.modules.updates.manifest.raw.RawManifest;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.utils.ScopedContext;

public interface ScopedModuleRegistryAdapter {
  List<ViewManager> createViewManagers(ReactApplicationContext reactContext);
  List<NativeModule> createNativeModules(ScopedContext scopedContext, ExperienceId experienceId, Map<String, Object> experienceProperties, RawManifest manifest, List<NativeModule> otherModules);
}
