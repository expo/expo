// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import com.facebook.react.bridge.WritableMap;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import javax.inject.Inject;

import expo.modules.updates.UpdatesConfiguration;
import expo.modules.updates.UpdatesUtils;
import expo.modules.updates.db.DatabaseHolder;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.launcher.Launcher;
import expo.modules.updates.launcher.SelectionPolicy;
import expo.modules.updates.launcher.SelectionPolicyNewest;
import expo.modules.updates.loader.LoaderTask;
import expo.modules.updates.manifest.Manifest;
import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExpoViewKernel;
import host.exp.exponent.kernel.ExponentUrls;
import host.exp.exponent.kernel.KernelConfig;
import host.exp.exponent.storage.ExponentDB;
import host.exp.exponent.storage.ExponentSharedPreferences;

public abstract class ExpoUpdatesAppLoader {

  @Inject
  ExponentManifest mExponentManifest;

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  @Inject
  DatabaseHolder mDatabaseHolder;

  private static final String TAG = ExpoUpdatesAppLoader.class.getSimpleName();

  private String mManifestUrl;
  private final boolean mUseCacheOnly;

  private Context mContext;

  public ExpoUpdatesAppLoader(String manifestUrl) {
    this(manifestUrl, false, null);
  }

  public ExpoUpdatesAppLoader(String manifestUrl, boolean useCacheOnly, Context context) {
    NativeModuleDepsProvider.getInstance().inject(ExpoUpdatesAppLoader.class, this);

    mManifestUrl = manifestUrl;
    mUseCacheOnly = useCacheOnly;
    mContext = context;
  }

  public abstract void onOptimisticManifest(JSONObject optimisticManifest);

  public abstract void onManifestCompleted(JSONObject manifest);

  public abstract void onBundleCompleted(String localBundlePath);

  public abstract void emitEvent(JSONObject params);

  public abstract void onError(Exception e);

  public abstract void onError(String e);

  public void start() {
    Uri manifestUrl = mExponentManifest.httpManifestUrl(mManifestUrl);

    HashMap<String, Object> configMap = new HashMap<>();
    configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY, manifestUrl);
    // TODO: if we want to use a scopeKey from the manifest here,
    //  need to either keep track of URL -> scopeKey mapping separately
    configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_SCOPE_KEY_KEY, mManifestUrl);
    configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_SDK_VERSION_KEY, Constants.SDK_VERSIONS);
    configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_HAS_EMBEDDED_UPDATE, false);
    configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_ENABLED_KEY, Constants.ARE_REMOTE_UPDATES_ENABLED);
    if (mUseCacheOnly) {
      configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_CHECK_ON_LAUNCH_KEY, "NEVER");
      configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_LAUNCH_WAIT_MS_KEY, 0);
    } else {
      // TODO: decide about default launch behavior for development client
      configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_LAUNCH_WAIT_MS_KEY, 10000);
    }

    configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY, getRequestHeaders());

    UpdatesConfiguration configuration = new UpdatesConfiguration();
    configuration.loadValuesFromMap(configMap);

    SelectionPolicy selectionPolicy = new SelectionPolicyNewest(Constants.SDK_VERSIONS_LIST);

    File directory;
    try {
      directory = UpdatesUtils.getOrCreateUpdatesDirectory(mContext);
    } catch (Exception e) {
      onError(e);
      return;
    }

    startLoaderTask(configuration, directory, selectionPolicy);
  }

  private void startLoaderTask(final UpdatesConfiguration configuration, final File directory, final SelectionPolicy selectionPolicy) {
    new LoaderTask(configuration, mDatabaseHolder, directory, selectionPolicy, new LoaderTask.LoaderTaskCallback() {
      @Override
      public void onFailure(Exception e) {
        onError(e);
      }

      @Override
      public boolean onCachedUpdateLoaded(UpdateEntity update) {
        boolean shouldForceRemote = false;
        if (isDevelopmentMode(update.metadata)) {
          shouldForceRemote = true;
        } else {
          try {
            String experienceId = update.metadata.getString(ExponentManifest.MANIFEST_ID_KEY);
            // if previous run of this app failed due to a loading error, we want to make sure to check for remote updates
            JSONObject experienceMetadata = mExponentSharedPreferences.getExperienceMetadata(experienceId);
            if (experienceMetadata != null && experienceMetadata.optBoolean(ExponentSharedPreferences.EXPERIENCE_METADATA_LOADING_ERROR)) {
              shouldForceRemote = true;
            }
          } catch (Exception e) {
            shouldForceRemote = false;
          }
        }

        if (shouldForceRemote && configuration.getCheckOnLaunch() != UpdatesConfiguration.CheckAutomaticallyConfiguration.ALWAYS) {
          HashMap<String, Object> configMap = new HashMap<>();
          configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_CHECK_ON_LAUNCH_KEY, "ALWAYS");
          configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_LAUNCH_WAIT_MS_KEY, 10000);
          configuration.loadValuesFromMap(configMap);
          startLoaderTask(configuration, directory, selectionPolicy);
          return false;
        }
        return true;
      }

      @Override
      public void onRemoteManifestLoaded(Manifest manifest) {
        onOptimisticManifest(manifest.getRawManifestJson());
      }

      @Override
      public void onSuccess(Launcher launcher) {
        try {
          JSONObject manifest = processAndSaveManifest(launcher.getLaunchedUpdate().metadata);
          onManifestCompleted(manifest);

          // ReactAndroid will load the bundle on its own in development mode
          if (!isDevelopmentMode(manifest)) {
            onBundleCompleted(launcher.getLaunchAssetFile());
          }
        } catch (Exception e) {
          onError(e);
        }
      }

      @Override
      public void onEvent(String eventName, WritableMap params) {
        try {
          JSONObject jsonParams = new JSONObject();
          jsonParams.put("type", eventName);
          Iterator<Map.Entry<String, Object>> iterator = params.getEntryIterator();
          while (iterator.hasNext()) {
            Map.Entry<String, Object> entry = iterator.next();
            jsonParams.put(entry.getKey(), entry.getValue());
          }
          emitEvent(jsonParams);
        } catch (Exception e) {
          Log.e(TAG, "Failed to emit event to JS", e);
        }
      }
    }).start(mContext);
  }

  private JSONObject processAndSaveManifest(JSONObject manifest) throws JSONException {
    Uri parsedManifestUrl = Uri.parse(mManifestUrl);
    if (isThirdPartyHosted(parsedManifestUrl) && !Constants.isStandaloneApp()) {
      // Sandbox third party apps and consider them verified
      // for https urls, sandboxed id is of form quinlanj.github.io/myProj-myApp
      // for http urls, sandboxed id is of form UNVERIFIED-quinlanj.github.io/myProj-myApp
      String protocol = parsedManifestUrl.getScheme();
      String securityPrefix = protocol.equals("https") || protocol.equals("exps") ? "" : "UNVERIFIED-";
      String path = parsedManifestUrl.getPath() != null ? parsedManifestUrl.getPath() : "";
      String slug = manifest.has(ExponentManifest.MANIFEST_SLUG) ? manifest.getString(ExponentManifest.MANIFEST_SLUG) : "";
      String sandboxedId = securityPrefix + parsedManifestUrl.getHost() + path + "-" + slug;
      manifest.put(ExponentManifest.MANIFEST_ID_KEY, sandboxedId);
      manifest.put(ExponentManifest.MANIFEST_IS_VERIFIED_KEY, true);
    }
    if (mExponentManifest.isAnonymousExperience(manifest)) {
      // automatically verified
      manifest.put(ExponentManifest.MANIFEST_IS_VERIFIED_KEY, true);
    }
    if (!manifest.has(ExponentManifest.MANIFEST_IS_VERIFIED_KEY)) {
      manifest.put(ExponentManifest.MANIFEST_IS_VERIFIED_KEY, false);
    }

    String bundleUrl = ExponentUrls.toHttp(manifest.getString(ExponentManifest.MANIFEST_BUNDLE_URL_KEY));

    Analytics.markEvent(Analytics.TimedEvent.FINISHED_FETCHING_MANIFEST);

    mExponentSharedPreferences.updateManifest(mManifestUrl, manifest, bundleUrl);
    ExponentDB.saveExperience(mManifestUrl, manifest, bundleUrl);

    return manifest;
  }

  private boolean isThirdPartyHosted(Uri uri) {
    String host = uri.getHost();
    return !(host.equals("exp.host") || host.equals("expo.io") || host.equals("exp.direct") || host.equals("expo.test") ||
      host.endsWith(".exp.host") || host.endsWith(".expo.io") || host.endsWith(".exp.direct") || host.endsWith(".expo.test"));
  }

  private boolean isDevelopmentMode(JSONObject manifest) {
    try {
      return manifest.has(ExponentManifest.MANIFEST_DEVELOPER_KEY) &&
        manifest.getJSONObject(ExponentManifest.MANIFEST_DEVELOPER_KEY).has(ExponentManifest.MANIFEST_DEVELOPER_TOOL_KEY);
    } catch (JSONException e) {
      return false;
    }
  }

  private Map<String, String> getRequestHeaders() {
    HashMap<String, String> headers = new HashMap<>();
    headers.put("Expo-Updates-Environment", getClientEnvironment());
    headers.put("Expo-Client-Environment", getClientEnvironment());

    if (ExpoViewKernel.getInstance().getVersionName() != null) {
      headers.put("Exponent-Version", ExpoViewKernel.getInstance().getVersionName());
    }

    String sessionSecret = mExponentSharedPreferences.getSessionSecret();
    if (sessionSecret != null) {
      headers.put("Expo-Session", sessionSecret);
    }

    // XDL expects the full "exponent-" header names
    headers.put("Exponent-Accept-Signature", "true");
    headers.put("Exponent-Platform", "android");
    if (KernelConfig.FORCE_UNVERSIONED_PUBLISHED_EXPERIENCES) {
      headers.put("Exponent-SDK-Version", "UNVERSIONED");
    } else {
      headers.put("Exponent-SDK-Version", Constants.SDK_VERSIONS);
    }

    return headers;
  }

  private String getClientEnvironment() {
    if (Constants.isStandaloneApp()) {
      return "STANDALONE";
    } else if (Build.FINGERPRINT.contains("vbox") || Build.FINGERPRINT.contains("generic")) {
      return "EXPO_SIMULATOR";
    } else {
      return "EXPO_DEVICE";
    }
  }
}
