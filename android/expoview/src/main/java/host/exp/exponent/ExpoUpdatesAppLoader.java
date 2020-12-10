// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.inject.Inject;

import androidx.annotation.Nullable;
import expo.modules.updates.UpdatesConfiguration;
import expo.modules.updates.UpdatesUtils;
import expo.modules.updates.db.DatabaseHolder;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.launcher.Launcher;
import expo.modules.updates.launcher.NoDatabaseLauncher;
import expo.modules.updates.launcher.SelectionPolicy;
import expo.modules.updates.launcher.SelectionPolicyNewest;
import expo.modules.updates.loader.EmbeddedLoader;
import expo.modules.updates.loader.LoaderTask;
import expo.modules.updates.manifest.Manifest;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.exceptions.ManifestException;
import host.exp.exponent.kernel.ExpoViewKernel;
import host.exp.exponent.kernel.Kernel;
import host.exp.exponent.kernel.KernelConfig;
import host.exp.exponent.storage.ExponentSharedPreferences;

public class ExpoUpdatesAppLoader {

  @Inject
  ExponentManifest mExponentManifest;

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  @Inject
  DatabaseHolder mDatabaseHolder;

  @Inject
  Kernel mKernel;

  private static final String TAG = ExpoUpdatesAppLoader.class.getSimpleName();

  public static final String UPDATES_EVENT_NAME = "Expo.nativeUpdatesEvent";
  public static final String UPDATE_AVAILABLE_EVENT = "updateAvailable";
  public static final String UPDATE_NO_UPDATE_AVAILABLE_EVENT = "noUpdateAvailable";
  public static final String UPDATE_ERROR_EVENT = "error";

  public enum AppLoaderStatus {
    CHECKING_FOR_UPDATE, DOWNLOADING_NEW_UPDATE
  }

  private String mManifestUrl;
  private AppLoaderCallback mCallback;
  private final boolean mUseCacheOnly;

  private UpdatesConfiguration mUpdatesConfiguration;
  private File mUpdatesDirectory;
  private SelectionPolicy mSelectionPolicy;
  private Launcher mLauncher;
  private boolean mIsEmergencyLaunch = false;
  private boolean mIsUpToDate = true;
  private AppLoaderStatus mStatus;
  private boolean mShouldShowAppLoaderStatus = true;

  private boolean isStarted = false;

  public interface AppLoaderCallback {
    void onOptimisticManifest(JSONObject optimisticManifest);
    void onManifestCompleted(JSONObject manifest);
    void onBundleCompleted(String localBundlePath);
    void emitEvent(JSONObject params);
    void updateStatus(AppLoaderStatus status);
    void onError(Exception e);
  }

  public ExpoUpdatesAppLoader(String manifestUrl, AppLoaderCallback callback) {
    this(manifestUrl, callback, false);
  }

  public ExpoUpdatesAppLoader(String manifestUrl, AppLoaderCallback callback, boolean useCacheOnly) {
    NativeModuleDepsProvider.getInstance().inject(ExpoUpdatesAppLoader.class, this);

    mManifestUrl = manifestUrl;
    mCallback = callback;
    mUseCacheOnly = useCacheOnly;
  }

  public UpdatesConfiguration getUpdatesConfiguration() {
    if (mUpdatesConfiguration == null) {
      throw new IllegalStateException("Tried to access UpdatesConfiguration before it was set");
    }
    return mUpdatesConfiguration;
  }

  public File getUpdatesDirectory() {
    if (mUpdatesDirectory == null) {
      throw new IllegalStateException("Tried to access UpdatesDirectory before it was set");
    }
    return mUpdatesDirectory;
  }

  public SelectionPolicy getSelectionPolicy() {
    if (mSelectionPolicy == null) {
      throw new IllegalStateException("Tried to access SelectionPolicy before it was set");
    }
    return mSelectionPolicy;
  }

  public Launcher getLauncher() {
    if (mLauncher == null) {
      throw new IllegalStateException("Tried to access Launcher before it was set");
    }
    return mLauncher;
  }

  public boolean isEmergencyLaunch() {
    return mIsEmergencyLaunch;
  }

  public boolean isUpToDate() {
    return mIsUpToDate;
  }

  public AppLoaderStatus getStatus() {
    return mStatus;
  }

  public boolean shouldShowAppLoaderStatus() {
    return mShouldShowAppLoaderStatus;
  }

  private void updateStatus(AppLoaderStatus status) {
    mStatus = status;
    mCallback.updateStatus(status);
  }

  public void start(Context context) {
    if (isStarted) {
      throw new IllegalStateException("AppLoader for " + mManifestUrl + " was started twice. AppLoader.start() may only be called once per instance.");
    }
    isStarted = true;
    mStatus = AppLoaderStatus.CHECKING_FOR_UPDATE;

    mKernel.addAppLoaderForManifestUrl(mManifestUrl, this);

    Uri httpManifestUrl = mExponentManifest.httpManifestUrl(mManifestUrl);

    HashMap<String, Object> configMap = new HashMap<>();
    configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY, httpManifestUrl);
    configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_SCOPE_KEY_KEY, httpManifestUrl.toString());
    configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_SDK_VERSION_KEY, Constants.SDK_VERSIONS);
    configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_RELEASE_CHANNEL_KEY, Constants.RELEASE_CHANNEL);
    configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_HAS_EMBEDDED_UPDATE, Constants.isStandaloneApp());
    configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_ENABLED_KEY, Constants.ARE_REMOTE_UPDATES_ENABLED);
    if (mUseCacheOnly) {
      configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_CHECK_ON_LAUNCH_KEY, "NEVER");
      configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_LAUNCH_WAIT_MS_KEY, 0);
    } else {
      if (Constants.isStandaloneApp()) {
        configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_CHECK_ON_LAUNCH_KEY, Constants.UPDATES_CHECK_AUTOMATICALLY ? "ALWAYS" : "NEVER");
        configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_LAUNCH_WAIT_MS_KEY, Constants.UPDATES_FALLBACK_TO_CACHE_TIMEOUT);
      } else {
        configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_CHECK_ON_LAUNCH_KEY, "ALWAYS");
        configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_LAUNCH_WAIT_MS_KEY, 60000);
      }
    }

    configMap.put(UpdatesConfiguration.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY, getRequestHeaders());

    UpdatesConfiguration configuration = new UpdatesConfiguration();
    configuration.loadValuesFromMap(configMap);

    List<String> sdkVersionsList = new ArrayList<>(Constants.SDK_VERSIONS_LIST);
    sdkVersionsList.add(RNObject.UNVERSIONED);
    SelectionPolicy selectionPolicy = new SelectionPolicyNewest(sdkVersionsList);

    File directory;
    try {
      directory = UpdatesUtils.getOrCreateUpdatesDirectory(context);
    } catch (Exception e) {
      mCallback.onError(e);
      return;
    }

    startLoaderTask(configuration, directory, selectionPolicy, context);
  }

  private void startLoaderTask(final UpdatesConfiguration configuration, final File directory, final SelectionPolicy selectionPolicy, final Context context) {
    mUpdatesConfiguration = configuration;
    mUpdatesDirectory = directory;
    mSelectionPolicy = selectionPolicy;

    if (!configuration.isEnabled()) {
      launchWithNoDatabase(context, null);
      return;
    }

    new LoaderTask(configuration, mDatabaseHolder, directory, selectionPolicy, new LoaderTask.LoaderTaskCallback() {
      private boolean didAbort = false;

      @Override
      public void onFailure(Exception e) {
        if (Constants.isStandaloneApp()) {
          mIsEmergencyLaunch = true;
          launchWithNoDatabase(context, e);
        } else {
          if (didAbort) {
            return;
          }
          Exception exception = e;
          try {
            JSONObject errorJson = new JSONObject(e.getMessage());
            exception = new ManifestException(e, mManifestUrl, errorJson);
          } catch (Exception ex) {
            // do nothing, expected if the error payload does not come from a conformant server
          }
          mCallback.onError(exception);
        }
      }

      @Override
      public boolean onCachedUpdateLoaded(UpdateEntity update) {
        setShouldShowAppLoaderStatus(update.metadata);
        if (isUsingDeveloperTool(update.metadata)) {
          return false;
        } else {
          try {
            String experienceId = update.metadata.getString(ExponentManifest.MANIFEST_ID_KEY);
            // if previous run of this app failed due to a loading error, we want to make sure to check for remote updates
            JSONObject experienceMetadata = mExponentSharedPreferences.getExperienceMetadata(experienceId);
            if (experienceMetadata != null && experienceMetadata.optBoolean(ExponentSharedPreferences.EXPERIENCE_METADATA_LOADING_ERROR)) {
              return false;
            }
          } catch (Exception e) {
            return true;
          }
        }
        return true;
      }

      @Override
      public void onRemoteManifestLoaded(Manifest manifest) {
        // expo-cli does not always respect our SDK version headers and respond with a compatible update or an error
        // so we need to check the compatibility here
        if (!isValidSdkVersion(manifest.getRawManifestJson().optString("sdkVersion"))) {
          mCallback.onError(formatExceptionForIncompatibleSdk(manifest.getRawManifestJson().optString("sdkVersion", "null")));
          didAbort = true;
          return;
        }

        setShouldShowAppLoaderStatus(manifest.getRawManifestJson());
        mCallback.onOptimisticManifest(manifest.getRawManifestJson());
        updateStatus(AppLoaderStatus.DOWNLOADING_NEW_UPDATE);
      }

      @Override
      public void onSuccess(Launcher launcher, boolean isUpToDate) {
        if (didAbort) {
          return;
        }
        mLauncher = launcher;
        mIsUpToDate = isUpToDate;
        try {
          JSONObject manifest = processManifest(launcher.getLaunchedUpdate().metadata);
          mCallback.onManifestCompleted(manifest);

          // ReactAndroid will load the bundle on its own in development mode
          if (!ExponentManifest.isDebugModeEnabled(manifest)) {
            mCallback.onBundleCompleted(launcher.getLaunchAssetFile());
          }
        } catch (Exception e) {
          mCallback.onError(e);
        }
      }

      @Override
      public void onBackgroundUpdateFinished(LoaderTask.BackgroundUpdateStatus status, @Nullable UpdateEntity update, @Nullable Exception exception) {
        if (didAbort) {
          return;
        }
        try {
          JSONObject jsonParams = new JSONObject();
          if (status == LoaderTask.BackgroundUpdateStatus.ERROR) {
            if (exception == null) {
              throw new AssertionError("Background update with error status must have a nonnull exception object");
            }
            jsonParams.put("type", UPDATE_ERROR_EVENT);
            jsonParams.put("message", exception.getMessage());
          } else if (status == LoaderTask.BackgroundUpdateStatus.UPDATE_AVAILABLE) {
            if (update == null) {
              throw new AssertionError("Background update with error status must have a nonnull update object");
            }
            jsonParams.put("type", UPDATE_AVAILABLE_EVENT);
            jsonParams.put("manifestString", update.metadata.toString());
          } else if (status == LoaderTask.BackgroundUpdateStatus.NO_UPDATE_AVAILABLE) {
            jsonParams.put("type", UPDATE_NO_UPDATE_AVAILABLE_EVENT);
          }
          mCallback.emitEvent(jsonParams);
        } catch (Exception e) {
          Log.e(TAG, "Failed to emit event to JS", e);
        }
      }
    }).start(context);
  }

  private void launchWithNoDatabase(Context context, Exception e) {
    mLauncher = new NoDatabaseLauncher(context, mUpdatesConfiguration, e);

    JSONObject manifest = EmbeddedLoader.readEmbeddedManifest(context, mUpdatesConfiguration).getRawManifestJson();
    try {
      manifest = processManifest(manifest);
    } catch (Exception ex) {
      Log.e(TAG, "Failed to process manifest; attempting to launch with raw manifest. This may cause errors or unexpected behavior.", e);
    }
    mCallback.onManifestCompleted(manifest);

    String launchAssetFile = mLauncher.getLaunchAssetFile();
    if (launchAssetFile == null) {
      // ReactInstanceManagerBuilder accepts embedded assets as strings with "assets://" prefixed
      launchAssetFile = "assets://" + mLauncher.getBundleAssetName();
    }
    mCallback.onBundleCompleted(launchAssetFile);
  }

  private JSONObject processManifest(JSONObject manifest) throws JSONException {
    Uri parsedManifestUrl = Uri.parse(mManifestUrl);
    if (!manifest.has(ExponentManifest.MANIFEST_IS_VERIFIED_KEY) &&
        isThirdPartyHosted(parsedManifestUrl) &&
        !Constants.isStandaloneApp()) {
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
    if (Constants.isStandaloneApp()) {
      manifest.put(ExponentManifest.MANIFEST_IS_VERIFIED_KEY, true);
    }
    if (!manifest.has(ExponentManifest.MANIFEST_IS_VERIFIED_KEY)) {
      manifest.put(ExponentManifest.MANIFEST_IS_VERIFIED_KEY, false);
    }

    if (!manifest.optBoolean(ExponentManifest.MANIFEST_IS_VERIFIED_KEY, false) &&
        mExponentManifest.isAnonymousExperience(manifest)) {
      // automatically verified
      manifest.put(ExponentManifest.MANIFEST_IS_VERIFIED_KEY, true);
    }

    return manifest;
  }

  private boolean isThirdPartyHosted(Uri uri) {
    String host = uri.getHost();
    return !(host.equals("exp.host") || host.equals("expo.io") || host.equals("exp.direct") || host.equals("expo.test") ||
      host.endsWith(".exp.host") || host.endsWith(".expo.io") || host.endsWith(".exp.direct") || host.endsWith(".expo.test"));
  }

  private boolean isUsingDeveloperTool(JSONObject manifest) {
    try {
      return manifest.has(ExponentManifest.MANIFEST_DEVELOPER_KEY) &&
        manifest.getJSONObject(ExponentManifest.MANIFEST_DEVELOPER_KEY).has(ExponentManifest.MANIFEST_DEVELOPER_TOOL_KEY);
    } catch (JSONException e) {
      return false;
    }
  }

  private void setShouldShowAppLoaderStatus(JSONObject manifest) {
    // we don't want to show the cached experience alert when Updates.reloadAsync() is called
    if (mUseCacheOnly) {
      mShouldShowAppLoaderStatus = false;
      return;
    }

    try {
      mShouldShowAppLoaderStatus = !(manifest.has(ExponentManifest.MANIFEST_DEVELOPMENT_CLIENT_KEY) &&
        manifest.getJSONObject(ExponentManifest.MANIFEST_DEVELOPMENT_CLIENT_KEY)
          .optBoolean(ExponentManifest.MANIFEST_DEVELOPMENT_CLIENT_SILENT_LAUNCH_KEY, false));

      if (mShouldShowAppLoaderStatus) {
        // we want to avoid showing the status for older snack SDK versions, too
        // we make our best guess based on the manifest fields
        // TODO: remove this after SDK 38 is phased out
        if (manifest.has(ExponentManifest.MANIFEST_SDK_VERSION_KEY) &&
            ABIVersion.toNumber("39.0.0") > ABIVersion.toNumber(manifest.getString(ExponentManifest.MANIFEST_SDK_VERSION_KEY)) &&
            "snack".equals(manifest.optString(ExponentManifest.MANIFEST_SLUG)) &&
            manifest.optString(ExponentManifest.MANIFEST_BUNDLE_URL_KEY, "").startsWith("https://d1wp6m56sqw74a.cloudfront.net/%40exponent%2Fsnack")
        ) {
          mShouldShowAppLoaderStatus = false;
        }
      }
    } catch (JSONException e) {
      mShouldShowAppLoaderStatus = true;
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

  private boolean isValidSdkVersion(String sdkVersion) {
    if (RNObject.UNVERSIONED.equals(sdkVersion)) {
      return true;
    }

    for (final String version : Constants.SDK_VERSIONS_LIST) {
      if (version.equals(sdkVersion)) {
        return true;
      }
    }

    return false;
  }

  private ManifestException formatExceptionForIncompatibleSdk(String sdkVersion) {
    JSONObject errorJson = new JSONObject();
    try {
      errorJson.put("message", "Invalid SDK version");
      if (ABIVersion.toNumber(sdkVersion) > ABIVersion.toNumber(Constants.SDK_VERSIONS_LIST.get(0))) {
        errorJson.put("errorCode", "EXPERIENCE_SDK_VERSION_TOO_NEW");
      } else {
        errorJson.put("errorCode", "EXPERIENCE_SDK_VERSION_OUTDATED");
        errorJson.put("metadata", new JSONObject().put(
          "availableSDKVersions",
          new JSONArray().put(sdkVersion))
        );
      }
    } catch (Exception e) {
      Log.e(TAG, "Failed to format error message for incompatible SDK version", e);
    }
    return new ManifestException(new Exception("Incompatible SDK version"), mManifestUrl, errorJson);
  }
}
