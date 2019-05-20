package expo.modules.ads.facebook;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.facebook.ads.AdSettings;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.LifecycleEventListener;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;
import org.unimodules.core.interfaces.services.UIManager;

public class AdSettingsManager extends ExportedModule implements LifecycleEventListener, ModuleRegistryConsumer {

  final static private String TAG = AdSettingsManager.class.getName();

  private HashSet<String> mTestDeviceHashes = new HashSet<>();
  private boolean mIsChildDirected = false;
  private String mMediationService = null;
  private String mUrlPrefix = null;

  private ModuleRegistry mModuleRegistry;

  public AdSettingsManager(Context reactContext) {
    super(reactContext);
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    if (mModuleRegistry != null) {
      UIManager uiManager = mModuleRegistry.getModule(UIManager.class);
      if (uiManager != null) {
        uiManager.unregisterLifecycleEventListener(this);
      }
    }
    mModuleRegistry = moduleRegistry;
    if (mModuleRegistry != null) {
      UIManager uiManager = mModuleRegistry.getModule(UIManager.class);
      if (uiManager != null) {
        uiManager.registerLifecycleEventListener(this);
      }
    }
  }

  @Override
  public String getName() {
    return "CTKAdSettingsManager";
  }

  @ExpoMethod
  public void addTestDevice(String deviceHash, Promise promise) {
    AdSettings.addTestDevice(deviceHash);
    mTestDeviceHashes.add(deviceHash);
    promise.resolve(null);
  }

  @ExpoMethod
  public void clearTestDevices(Promise promise) {
    AdSettings.clearTestDevices();
    mTestDeviceHashes.clear();
    promise.resolve(null);
  }

  @ExpoMethod
  public void setLogLevel(String logLevel, Promise promise) {
    Log.w(TAG, "This method is not supported on Android");
    promise.resolve(null);
  }

  @ExpoMethod
  public void setIsChildDirected(boolean isChildDirected, Promise promise) {
    AdSettings.setIsChildDirected(isChildDirected);
    mIsChildDirected = isChildDirected;
    promise.resolve(null);
  }

  @ExpoMethod
  public void setMediationService(String mediationService, Promise promise) {
    AdSettings.setMediationService(mediationService);
    mMediationService = mediationService;
    promise.resolve(null);
  }

  @ExpoMethod
  public void setUrlPrefix(String urlPrefix, Promise promise) {
    AdSettings.setUrlPrefix(urlPrefix);
    mUrlPrefix = urlPrefix;
    promise.resolve(null);
  }

  private void restoreSettings() {
    for (String hash : mTestDeviceHashes) {
      AdSettings.addTestDevice(hash);
    }

    AdSettings.setIsChildDirected(mIsChildDirected);
    AdSettings.setMediationService(mMediationService);
    AdSettings.setUrlPrefix(mUrlPrefix);
  }

  private void clearSettings() {
    AdSettings.clearTestDevices();
    AdSettings.setIsChildDirected(false);
    AdSettings.setMediationService(null);
    AdSettings.setUrlPrefix(null);
  }

  @Override
  public void onHostResume() {
    restoreSettings();
  }

  @Override
  public void onHostPause() {
    clearSettings();
  }

  @Override
  public void onHostDestroy() {
    clearSettings();
  }

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();
    SharedPreferences sp = getContext().getSharedPreferences("FBAdPrefs", 0);
    String deviceHashedId = sp.getString("deviceIdHash", null);

    constants.put("currentDeviceHash", deviceHashedId);

    return constants;
  }
}
