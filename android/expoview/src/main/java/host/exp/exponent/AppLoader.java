// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import org.json.JSONException;
import org.json.JSONObject;

import javax.inject.Inject;

import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.exceptions.ExceptionUtils;
import host.exp.exponent.kernel.ExponentUrls;
import host.exp.exponent.storage.ExponentDB;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.expoview.ExpoViewBuildConfig;
import host.exp.expoview.Exponent;

public abstract class AppLoader {

  private static final String TAG = AppLoader.class.getSimpleName();

  @Inject
  ExponentManifest mExponentManifest;

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  @Inject
  ExpoHandler mExpoHandler;

  private String mManifestUrl;
  private JSONObject mCachedManifest;
  private JSONObject mManifest;
  private String mLocalBundlePath;
  private boolean hasResolved = false;
  private final boolean mUseCacheOnly;
  private Runnable mRunnable;

  private static final int DEFAULT_TIMEOUT_LENGTH = 30000;
  private static final int DEFAULT_TIMEOUT_LENGTH_BEFORE_SDK26 = 0;

  public static final String UPDATES_EVENT_NAME = "Exponent.nativeUpdatesEvent";
  public static final String UPDATE_DOWNLOAD_START_EVENT = "downloadStart";
  public static final String UPDATE_DOWNLOAD_PROGRESS_EVENT = "downloadProgress";
  public static final String UPDATE_DOWNLOAD_FINISHED_EVENT = "downloadFinished";
  public static final String UPDATE_NO_UPDATE_AVAILABLE_EVENT = "noUpdateAvailable";
  public static final String UPDATE_ERROR_EVENT = "error";

  public AppLoader(String manifestUrl) {
    this(manifestUrl, false);
  }

  public AppLoader(String manifestUrl, boolean useCacheOnly) {
    NativeModuleDepsProvider.getInstance().inject(AppLoader.class, this);

    mManifestUrl = manifestUrl;
    mUseCacheOnly = useCacheOnly;
    mRunnable = new Runnable() {
      @Override
      public void run() {
        resolve();
      }
    };
  }

  public void start() {
    // if remote updates are disabled, skip all code that could fetch remote updates
    if (!Constants.ARE_REMOTE_UPDATES_ENABLED && !ExpoViewBuildConfig.DEBUG) {
      mExponentManifest.fetchEmbeddedManifest(mManifestUrl, new ExponentManifest.ManifestListener() {
        @Override
        public void onCompleted(JSONObject manifest) {
          mManifest = manifest;
          fetchJSBundle(true, true);
        }

        @Override
        public void onError(Exception e) {
          resolve(e);
        }

        @Override
        public void onError(String e) {
          resolve(new Exception(e));
        }
      });
      return;
    }

    boolean isFetchingCachedManifest = mExponentManifest.fetchCachedManifest(mManifestUrl, new ExponentManifest.ManifestListener() {
      @Override
      public void onCompleted(JSONObject manifest) {
        mCachedManifest = manifest;

        boolean shouldCheckForUpdate = true;
        int fallbackToCacheTimeout = DEFAULT_TIMEOUT_LENGTH;
        String manifestSdkVersion = null;

        try {
          // another check in case dev mode check failed before
          if (ExponentManifest.isDebugModeEnabled(mCachedManifest)) {
            fetchRemoteManifest();
            return;
          }
          String experienceId = mCachedManifest.getString(ExponentManifest.MANIFEST_ID_KEY);
          manifestSdkVersion = mCachedManifest.optString(ExponentManifest.MANIFEST_SDK_VERSION_KEY, null);
          JSONObject updatesManifest = mCachedManifest.optJSONObject(ExponentManifest.MANIFEST_UPDATES_INFO_KEY);
          if (updatesManifest != null) {
            String checkAutomaticallyBehavior = updatesManifest.optString(ExponentManifest.MANIFEST_UPDATES_CHECK_AUTOMATICALLY_KEY, ExponentManifest.MANIFEST_UPDATES_CHECK_AUTOMATICALLY_ON_LOAD);
            if (checkAutomaticallyBehavior.equals(ExponentManifest.MANIFEST_UPDATES_CHECK_AUTOMATICALLY_ON_ERROR)) {
              shouldCheckForUpdate = false;
            }
            fallbackToCacheTimeout = updatesManifest.optInt(ExponentManifest.MANIFEST_UPDATES_TIMEOUT_KEY, fallbackToCacheTimeout);
          }

          // if previous run of this app failed due to a loading error, set shouldCheckForUpdate to true regardless
          JSONObject experienceMetadata = mExponentSharedPreferences.getExperienceMetadata(experienceId);
          if (experienceMetadata != null && experienceMetadata.optBoolean(ExponentSharedPreferences.EXPERIENCE_METADATA_LOADING_ERROR)) {
            shouldCheckForUpdate = true;
          }
        } catch (JSONException e) {
          onError(e);
        }

        if (Constants.isShellApp() || Constants.isDetached()) {
          // in shell/detached apps with SDK <26, we should default to 0 timeout to not introduce a breaking change
          if (manifestSdkVersion != null) {
            if (ABIVersion.toNumber(manifestSdkVersion) < ABIVersion.toNumber("26.0.0")) {
              fallbackToCacheTimeout = DEFAULT_TIMEOUT_LENGTH_BEFORE_SDK26;
            }
          }
        } else {
          // only support checkAutomatically: never in shell & detached apps
          shouldCheckForUpdate = true;
        }

        if (mUseCacheOnly) {
          // finally, ignore everything else and don't check for updates if this is a cache-only AppLoader
          // e.g. user has called Updates.reloadFromCache()
          shouldCheckForUpdate = false;
        }

        if (shouldCheckForUpdate) {
          startTimerAndFetchRemoteManifest(fallbackToCacheTimeout);
        } else {
          resolve();
        }
      }

      @Override
      public void onError(Exception e) {
        EXL.e(TAG, "Error fetching cached manifest, falling back to default timeout: " + ExceptionUtils.exceptionToErrorMessage(e).developerErrorMessage());
        startTimerAndFetchRemoteManifest();
      }

      @Override
      public void onError(String e) {
        EXL.e(TAG, "Error fetching cached manifest, falling back to default timeout: " + e);
        startTimerAndFetchRemoteManifest();
      }
    });

    if (!isFetchingCachedManifest) {
      // we're in dev mode so start fetching remotely without setting a timer
      fetchRemoteManifest();
    }
  }

  public abstract void onOptimisticManifest(JSONObject optimisticManifest);

  public abstract void onManifestCompleted(JSONObject manifest);

  public abstract void onBundleCompleted(String localBundlePath);

  public abstract void emitEvent(JSONObject params);

  public abstract void onError(Exception e);

  public abstract void onError(String e);

  private void startTimerAndFetchRemoteManifest() {
    startTimerAndFetchRemoteManifest(DEFAULT_TIMEOUT_LENGTH);
  }

  private void startTimerAndFetchRemoteManifest(int timeoutLength) {
    mExpoHandler.postDelayed(mRunnable, timeoutLength);

    fetchRemoteManifest();
  }

  public void fetchRemoteManifest() {
    mExponentManifest.fetchManifest(mManifestUrl, new ExponentManifest.ManifestListener() {
      @Override
      public void onCompleted(JSONObject manifest) {
        mManifest = manifest;
        // don't send manifest for loading screen in dev mode, as loading screen is handled
        // separately by RN activity in this case
        if (!ExponentManifest.isDebugModeEnabled(manifest) && !hasResolved) {
          onOptimisticManifest(manifest);
        }
        fetchJSBundle(false);
      }

      @Override
      public void onError(Exception e) {
        resolve(e);
      }

      @Override
      public void onError(String e) {
        resolve(new Exception(e));
      }
    });
  }

  private void stopTimer() {
    mExpoHandler.removeCallbacks(mRunnable);
  }

  private void resolve() {
    resolve(null);
  }

  private void resolve(Exception e) {
    if (hasResolved) {
      return;
    }

    if (mManifest != null && mLocalBundlePath != null) {
      stopTimer();
      hasResolved = true;

      String bundleUrl;
      try {
        bundleUrl = ExponentUrls.toHttp(mManifest.getString(ExponentManifest.MANIFEST_BUNDLE_URL_KEY));
      } catch (JSONException ex) {
        onError(ex);
        return;
      }

      Analytics.markEvent(Analytics.TimedEvent.FINISHED_FETCHING_MANIFEST);

      mExponentSharedPreferences.updateManifest(mManifestUrl, mManifest, bundleUrl);
      ExponentDB.saveExperience(mManifestUrl, mManifest, bundleUrl);

      onManifestCompleted(mManifest);
      // prevent a weird race condition in dev mode by checking here
      // we don't want to resolve the bundle anyway in dev mode because downloading is handled by the RN Activity
      if (!ExponentManifest.isDebugModeEnabled(mManifest)) {
        onBundleCompleted(mLocalBundlePath);
      }
    } else if (mCachedManifest != null) {
      mManifest = mCachedManifest;
      // make sure we only go down this path once
      mCachedManifest = null;
      fetchJSBundle(true);
    } else {
      hasResolved = true;
      if (e != null) {
        EXL.e(TAG, "Could not load app: " + ExceptionUtils.exceptionToErrorMessage(e).developerErrorMessage());
        onError(e);
      } else {
        onError("Could not load request from " + mManifestUrl + ": the request timed out");
      }
    }
  }

  private void fetchJSBundle(final boolean forceCache) {
    fetchJSBundle(forceCache, false);
  }

  private void fetchJSBundle(final boolean forceCache, final boolean shouldFailOnError) {
    // if in dev mode, do not fetch a JS bundle here, as that is handled entirely by internal RN
    if (ExponentManifest.isDebugModeEnabled(mManifest)) {
      mLocalBundlePath = "";
      resolve();
      return;
    }

    try {
      String oldBundleUrl = null;
      try {
        JSONObject oldManifest = mExponentSharedPreferences.getManifest(mManifestUrl).manifest;
        oldBundleUrl = oldManifest.getString(ExponentManifest.MANIFEST_BUNDLE_URL_KEY);
      } catch (Throwable e) {
        EXL.e(TAG, "Couldn't get old manifest from shared preferences");
      }
      final String finalOldBundleUrl = oldBundleUrl;

      try {
        String bundleUrl = mManifest.getString(ExponentManifest.MANIFEST_BUNDLE_URL_KEY);
        final boolean wasUpdated = !bundleUrl.equals(finalOldBundleUrl);
        String id = mManifest.getString(ExponentManifest.MANIFEST_ID_KEY);
        String sdkVersion = mManifest.getString(ExponentManifest.MANIFEST_SDK_VERSION_KEY);

        final JSONObject finalManifest = mManifest;

        Exponent.getInstance().loadJSBundle(mManifest, bundleUrl, Exponent.getInstance().encodeExperienceId(id), sdkVersion, new Exponent.BundleListener() {
          @Override
          public void onError(Exception e) {
            // if we fail to get a cached bundle, try to download it over the network as a last resort before failing
            // if we've already done this last resort and it also failed, then show the error
            // otherwise we've just failed to get a network resource, and we should try to resolve with a cached resource
            if (shouldFailOnError) {
              resolve(e);
              return;
            }
            if (forceCache) {
              fetchJSBundle(false, true);
              return;
            }
            if (hasResolved) {
              JSONObject params = new JSONObject();
              try {
                params.put("type", UPDATE_ERROR_EVENT);
                params.put("message", e.getMessage());
                emitEvent(params);
              } catch (Exception ex) {
                EXL.e(TAG, ex);
              }
            }
            resolve();
          }

          @Override
          public void onBundleLoaded(String localBundlePath) {
            mLocalBundlePath = localBundlePath;
            if (hasResolved) {
              JSONObject params = new JSONObject();
              try {
                if (wasUpdated) {
                  params.put("type", UPDATE_DOWNLOAD_FINISHED_EVENT);
                  params.put("manifestString", finalManifest.toString());
                } else {
                  params.put("type", UPDATE_NO_UPDATE_AVAILABLE_EVENT);
                }
                emitEvent(params);
              } catch (Exception e) {
                EXL.e(TAG, e);
              }
              mExponentSharedPreferences.updateSafeManifest(mManifestUrl, finalManifest);
            }
            resolve();
          }
          // forceNetwork fetch the bundle depending on whether or not the bundleUrl has changed
          // since the last version we have cached
        }, wasUpdated, forceCache);

      } catch (JSONException e) {
        EXL.e(TAG, e);
        resolve(e);
      } catch (Exception e) {
        // Don't let any errors through
        EXL.e(TAG, "Couldn't load bundle: " + e.toString());
        resolve(e);
      }
    } catch (Exception e) {
      EXL.e(TAG, "Couldn't load manifest: " + e.toString());
      resolve(e);
    }
  }
}
