package abi28_0_0.host.exp.exponent.modules.api;

import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.Promise;
import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi28_0_0.com.facebook.react.bridge.ReactMethod;
import abi28_0_0.com.facebook.react.bridge.WritableMap;
import abi28_0_0.com.facebook.react.modules.core.DeviceEventManagerModule;

import org.json.JSONObject;

import java.util.Map;

import javax.inject.Inject;

import host.exp.exponent.AppLoader;
import host.exp.exponent.Constants;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.exponent.kernel.KernelProvider;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.expoview.Exponent;

public class UpdatesModule extends ReactContextBaseJavaModule {

  private static final String TAG = UpdatesModule.class.getSimpleName();
  private Map<String, Object> mExperienceProperties;
  private JSONObject mManifest;

  @Inject
  ExponentManifest mExponentManifest;

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  public UpdatesModule(ReactApplicationContext reactContext, Map<String, Object> experienceProperties, JSONObject manifest) {
    super(reactContext);
    NativeModuleDepsProvider.getInstance().inject(UpdatesModule.class, this);
    mExperienceProperties = experienceProperties;
    mManifest = manifest;
  }

  @Override
  public String getName() {
    return "ExponentUpdates";
  }

  @ReactMethod
  public void reload() {
    KernelProvider.getInstance().reloadVisibleExperience((String) mExperienceProperties.get(KernelConstants.MANIFEST_URL_KEY));
  }

  @ReactMethod
  public void reloadFromCache() {
    KernelProvider.getInstance().reloadVisibleExperience((String) mExperienceProperties.get(KernelConstants.MANIFEST_URL_KEY), true);
  }

  @ReactMethod
  public void checkForUpdateAsync(final Promise promise) {
    if (!Constants.ARE_REMOTE_UPDATES_ENABLED) {
      promise.reject("E_CHECK_UPDATE_FAILED", "Remote updates are disabled in app.json");
      return;
    }
    if (ExponentManifest.isDebugModeEnabled(mManifest)) {
      promise.reject("E_CHECK_UPDATE_FAILED", "Cannot check for updates in dev mode");
      return;
    }
    try {
      String manifestUrl = (String) mExperienceProperties.get(KernelConstants.MANIFEST_URL_KEY);
      final String currentRevisionId = mManifest.getString(ExponentManifest.MANIFEST_REVISION_ID_KEY);

      mExponentManifest.fetchManifest(manifestUrl, new ExponentManifest.ManifestListener() {
        @Override
        public void onCompleted(JSONObject manifest) {
          try {
            String newRevisionId = manifest.getString(ExponentManifest.MANIFEST_REVISION_ID_KEY);
            if (currentRevisionId.equals(newRevisionId)) {
              promise.resolve(false);
            } else {
              promise.resolve(manifest.toString());
            }
          } catch (Exception e) {
            onError(e);
          }
        }

        @Override
        public void onError(Exception e) {
          promise.reject("E_FETCH_MANIFEST_FAILED", e);
        }

        @Override
        public void onError(String e) {
          promise.reject("E_FETCH_MANIFEST_FAILED", e);
        }
      }, false);
    } catch (Exception e) {
      promise.reject("E_CHECK_UPDATE_FAILED", e);
    }
  }

  @ReactMethod
  public void fetchUpdateAsync(final Promise promise) {
    if (!Constants.ARE_REMOTE_UPDATES_ENABLED) {
      sendErrorAndReject("E_FETCH_UPDATE_FAILED", "Remote updates are disabled in app.json", promise);
      return;
    }
    if (ExponentManifest.isDebugModeEnabled(mManifest)) {
      sendErrorAndReject("E_FETCH_UPDATE_FAILED", "Cannot fetch updates in dev mode", promise);
      return;
    }
    String manifestUrl = (String) mExperienceProperties.get(KernelConstants.MANIFEST_URL_KEY);
    final String currentRevisionId = mManifest.optString(ExponentManifest.MANIFEST_REVISION_ID_KEY, "");
    mExponentManifest.fetchManifest(manifestUrl, new ExponentManifest.ManifestListener() {
      @Override
      public void onCompleted(JSONObject manifest) {
        try {
          String newRevisionId = manifest.getString(ExponentManifest.MANIFEST_REVISION_ID_KEY);
          if (currentRevisionId.equals(newRevisionId)) {
            // no update available
            sendEventAndResolve(AppLoader.UPDATE_NO_UPDATE_AVAILABLE_EVENT, promise);
            return;
          }
        } catch (Exception e) {
        }
        sendEventToJS(AppLoader.UPDATE_DOWNLOAD_START_EVENT, null);
        fetchJSBundleAsync(manifest, promise);
      }

      @Override
      public void onError(Exception e) {
        sendErrorAndReject("E_FETCH_MANIFEST_FAILED", "Unable to fetch updated manifest", e, promise);
      }

      @Override
      public void onError(String e) {
        sendErrorAndReject("E_FETCH_MANIFEST_FAILED", "Unable to fetch updated manifest", new Exception(e), promise);
      }
    });
  }

  private void fetchJSBundleAsync(final JSONObject manifest, final Promise promise) {
    try {
      String bundleUrl = manifest.getString(ExponentManifest.MANIFEST_BUNDLE_URL_KEY);
      String id = manifest.getString(ExponentManifest.MANIFEST_ID_KEY);
      String sdkVersion = manifest.getString(ExponentManifest.MANIFEST_SDK_VERSION_KEY);

      Exponent.getInstance().loadJSBundle(manifest, bundleUrl, Exponent.getInstance().encodeExperienceId(id), sdkVersion, new Exponent.BundleListener() {
        @Override
        public void onError(Exception e) {
          sendErrorAndReject("E_FETCH_BUNDLE_FAILED", "Failed to fetch new update", e, promise);
        }

        @Override
        public void onBundleLoaded(String localBundlePath) {
          String manifestString = manifest.toString();
          WritableMap params = Arguments.createMap();
          params.putString("manifestString", manifestString);

          sendEventToJS(AppLoader.UPDATE_DOWNLOAD_FINISHED_EVENT, params);
          promise.resolve(manifestString);

          mExponentSharedPreferences.updateSafeManifest((String) mExperienceProperties.get(KernelConstants.MANIFEST_URL_KEY), manifest);
        }
      });
    } catch (Exception e) {
      sendErrorAndReject("E_FETCH_BUNDLE_FAILED", "Failed to fetch new update", e, promise);
    }
  }

  private void sendErrorAndReject(String code, String message, Promise promise) {
    WritableMap params = Arguments.createMap();
    params.putString("message", message);
    sendEventToJS(AppLoader.UPDATE_ERROR_EVENT, params);
    promise.reject(code, message);
  }

  private void sendErrorAndReject(String code, String message, Throwable e, Promise promise) {
    WritableMap params = Arguments.createMap();
    params.putString("message", message);
    sendEventToJS(AppLoader.UPDATE_ERROR_EVENT, params);
    promise.reject(code, message, e);
  }

  private void sendEventAndResolve(String eventName, Promise promise) {
    sendEventToJS(eventName, null);
    promise.resolve(null);
  }

  private void sendEventToJS(String eventName, WritableMap params) {
    WritableMap paramsToSend = params;
    if (params == null) {
      paramsToSend = Arguments.createMap();
    }
    paramsToSend.putString("type", eventName);
    getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(AppLoader.UPDATES_EVENT_NAME, paramsToSend);
  }
}
