package abi30_0_0.host.exp.exponent.modules.universal;

import abi30_0_0.com.facebook.react.bridge.NativeModule;
import abi30_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi30_0_0.com.facebook.react.uimanager.ViewManager;

import org.json.JSONObject;

import java.util.List;
import java.util.Map;

import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.utils.ScopedContext;

public interface ScopedModuleRegistryAdapter {
  List<ViewManager> createViewManagers(ReactApplicationContext reactContext);
  List<NativeModule> createNativeModules(ScopedContext scopedContext, ExperienceId experienceId, Map<String, Object> experienceProperties, JSONObject manifest, List<NativeModule> otherModules);
}
