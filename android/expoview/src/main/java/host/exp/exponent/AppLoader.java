// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.os.Handler;
import android.os.Looper;

import org.json.JSONException;
import org.json.JSONObject;

import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.kernel.ExponentUrls;
import host.exp.exponent.storage.ExponentDB;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.expoview.Exponent;

public abstract class AppLoader {

  private static final String TAG = AppLoader.class.getSimpleName();

  private String mManifestUrl;
  private JSONObject mCachedManifest;
  private JSONObject mManifest;
  private String mLocalBundlePath;
  private boolean hasResolved = false;
  private ExponentManifest mExponentManifest;
  private ExponentSharedPreferences mExponentSharedPreferences;
  private Handler mHandler;
  private Runnable mRunnable;

  private static final int DEFAULT_TIMEOUT_LENGTH = 30000;

  public AppLoader(String manifestUrl, ExponentManifest exponentManifest, ExponentSharedPreferences exponentSharedPreferences) {
    mManifestUrl = manifestUrl;
    mExponentManifest = exponentManifest;
    mExponentSharedPreferences = exponentSharedPreferences;
    mHandler = new Handler(Looper.getMainLooper());
    mRunnable = new Runnable() {
      @Override
      public void run() {
        resolve();
      }
    };
  }

  public void start() {
    boolean isFetchingCachedManifest = mExponentManifest.fetchCachedManifest(mManifestUrl, new ExponentManifest.ManifestListener() {
      @Override
      public void onCompleted(JSONObject manifest) {
        mCachedManifest = manifest;

        boolean shouldCheckForUpdate = true;
        int fallbackToCacheTimeout = DEFAULT_TIMEOUT_LENGTH;

        try {
          String experienceId = mCachedManifest.getString(ExponentManifest.MANIFEST_ID_KEY);
          JSONObject updatesManifest = mCachedManifest.optJSONObject(ExponentManifest.MANIFEST_UPDATES_INFO_KEY);
          if (updatesManifest != null) {
            String checkAutomaticallyBehavior = updatesManifest.optString(ExponentManifest.MANIFEST_UPDATES_CHECK_AUTOMATICALLY_KEY, ExponentManifest.MANIFEST_UPDATES_CHECK_AUTOMATICALLY_LAUNCH);
            if (checkAutomaticallyBehavior.equals(ExponentManifest.MANIFEST_UPDATES_CHECK_AUTOMATICALLY_NEVER)) {
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

        if (shouldCheckForUpdate) {
          startTimerAndFetchRemoteManifest(fallbackToCacheTimeout);
        } else {
          resolve();
        }
      }

      @Override
      public void onError(Exception e) {
        EXL.d(TAG, "Error fetching cached manifest, falling back to default timeout: " + e.toString());
        startTimerAndFetchRemoteManifest();
      }

      @Override
      public void onError(String e) {
        EXL.d(TAG, "Error fetching cached manifest, falling back to default timeout: " + e);
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

  public abstract void onError(Exception e);

  public abstract void onError(String e);

  private void startTimerAndFetchRemoteManifest() {
    startTimerAndFetchRemoteManifest(DEFAULT_TIMEOUT_LENGTH);
  }

  private void startTimerAndFetchRemoteManifest(int timeoutLength) {
    mHandler.postDelayed(mRunnable, timeoutLength);

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
        resolve();
      }

      @Override
      public void onError(String e) {
        resolve();
      }
    });
  }

  private void stopTimer() {
    mHandler.removeCallbacks(mRunnable);
  }

  private void resolve() {
    if (hasResolved) {
      return;
    }

    if (mManifest != null && mLocalBundlePath != null) {
      stopTimer();
      hasResolved = true;

      String bundleUrl;
      try {
        bundleUrl = ExponentUrls.toHttp(mManifest.getString(ExponentManifest.MANIFEST_BUNDLE_URL_KEY));
      } catch (JSONException e) {
        onError(e);
        return;
      }

      EXL.d(TAG, "Done fetching manifest");
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
      fetchJSBundle(true);
    } else {
      onError("Timed out, no manifest in cache");
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
        boolean wasUpdated = !bundleUrl.equals(finalOldBundleUrl);
        String id = mManifest.getString(ExponentManifest.MANIFEST_ID_KEY);
        String sdkVersion = mManifest.getString(ExponentManifest.MANIFEST_SDK_VERSION_KEY);

        Exponent.getInstance().loadJSBundle(mManifest, bundleUrl, Exponent.getInstance().encodeExperienceId(id), sdkVersion, new Exponent.BundleListener() {
          @Override
          public void onError(Exception e) {
            // if we fail to get a cached bundle, try to download it over the network as a last resort before failing
            // if we've already done this last resort and it also failed, then show the error
            // otherwise we've just failed to get a network resource, and we should try to resolve with a cached resource
            if (forceCache) {
              fetchJSBundle(false, true);
            } else {
              if (shouldFailOnError) {
                AppLoader.this.onError(e);
              } else {
                resolve();
              }
            }
          }

          @Override
          public void onBundleLoaded(String localBundlePath) {
            mLocalBundlePath = localBundlePath;
            resolve();
          }
          // forceNetwork fetch the bundle depending on whether or not the bundleUrl has changed
          // since the last version we have cached
        }, wasUpdated, forceCache);

      } catch (JSONException e) {
        EXL.e(TAG, e);
        onError(e);
      } catch (Exception e) {
        // Don't let any errors through
        EXL.e(TAG, "Couldn't load bundle: " + e.toString());
        onError(e);
      }
    } catch (Exception e) {
      EXL.e(TAG, "Couldn't load manifest: " + e.toString());
      onError(e);
    }
  }
}
