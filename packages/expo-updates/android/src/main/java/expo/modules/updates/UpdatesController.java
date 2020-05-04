package expo.modules.updates;

import android.content.Context;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.Looper;
import android.util.Log;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.WritableMap;

import androidx.annotation.Nullable;
import expo.modules.updates.db.Reaper;
import expo.modules.updates.db.UpdatesDatabase;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.launcher.DatabaseLauncher;
import expo.modules.updates.launcher.NoDatabaseLauncher;
import expo.modules.updates.launcher.Launcher;
import expo.modules.updates.launcher.SelectionPolicy;
import expo.modules.updates.launcher.SelectionPolicyNewest;
import expo.modules.updates.loader.EmbeddedLoader;
import expo.modules.updates.loader.RemoteLoader;

import java.io.File;
import java.lang.ref.WeakReference;
import java.lang.reflect.Field;
import java.util.Map;

public class UpdatesController {

  private static final String TAG = UpdatesController.class.getSimpleName();

  private static final String UPDATE_AVAILABLE_EVENT = "updateAvailable";
  private static final String UPDATE_NO_UPDATE_AVAILABLE_EVENT = "noUpdateAvailable";
  private static final String UPDATE_ERROR_EVENT = "error";

  private static UpdatesController sInstance;

  private WeakReference<ReactNativeHost> mReactNativeHost;

  private UpdatesConfiguration mUpdatesConfiguration;
  private File mUpdatesDirectory;
  private Exception mUpdatesDirectoryException;
  private Launcher mLauncher;
  private DatabaseHolder mDatabaseHolder;
  private SelectionPolicy mSelectionPolicy;

  // launch conditions
  private boolean mIsReadyToLaunch = false;
  private boolean mTimeoutFinished = false;
  private boolean mHasLaunched = false;
  private boolean mIsEmergencyLaunch = false;
  private HandlerThread mHandlerThread;

  private UpdatesController(Context context, UpdatesConfiguration updatesConfiguration) {
    mUpdatesConfiguration = updatesConfiguration;
    mDatabaseHolder = new DatabaseHolder(UpdatesDatabase.getInstance(context));
    mSelectionPolicy = new SelectionPolicyNewest(UpdatesUtils.getRuntimeVersion(updatesConfiguration));
    if (context instanceof ReactApplication) {
      mReactNativeHost = new WeakReference<>(((ReactApplication) context).getReactNativeHost());
    }

    try {
      mUpdatesDirectory = UpdatesUtils.getOrCreateUpdatesDirectory(context);
    } catch (Exception e) {
      mUpdatesDirectoryException = e;
      mUpdatesDirectory = null;
    }

    mHandlerThread = new HandlerThread("expo-updates-timer");
  }

  public static UpdatesController getInstance() {
    if (sInstance == null) {
      throw new IllegalStateException("UpdatesController.getInstance() was called before the module was initialized");
    }
    return sInstance;
  }

  /**
   * Initializes the UpdatesController singleton. This should be called as early as possible in the
   * application's lifecycle.
   * @param context the base context of the application, ideally a {@link ReactApplication}
   */
  public static void initialize(Context context) {
    if (sInstance == null) {
      UpdatesConfiguration updatesConfiguration = new UpdatesConfiguration().loadValuesFromMetadata(context);
      sInstance = new UpdatesController(context, updatesConfiguration);
      sInstance.start(context);
    }
  }

  /**
   * Initializes the UpdatesController singleton. This should be called as early as possible in the
   * application's lifecycle. Use this method to set or override configuration values at runtime
   * rather than from AndroidManifest.xml.
   * @param context the base context of the application, ideally a {@link ReactApplication}
   */
  public static void initialize(Context context, Map<String, Object> configuration) {
    if (sInstance == null) {
      UpdatesConfiguration updatesConfiguration = new UpdatesConfiguration()
        .loadValuesFromMetadata(context)
        .loadValuesFromMap(configuration);
      sInstance = new UpdatesController(context, updatesConfiguration);
      sInstance.start(context);
    }
  }

  /**
   * If UpdatesController.initialize() is not provided with a {@link ReactApplication}, this method
   * can be used to set a {@link ReactNativeHost} on the class. This is optional, but required in
   * order for `Updates.reload()` and some Updates module events to work.
   * @param reactNativeHost the ReactNativeHost of the application running the Updates module
   */
  public void setReactNativeHost(ReactNativeHost reactNativeHost) {
    mReactNativeHost = new WeakReference<>(reactNativeHost);
  }

  // database

  private class DatabaseHolder {
    private UpdatesDatabase mDatabase;
    private boolean isInUse = false;

    public DatabaseHolder(UpdatesDatabase database) {
      mDatabase = database;
    }

    public synchronized UpdatesDatabase getDatabase() {
      while (isInUse) {
        try {
          wait();
        } catch (InterruptedException e) {
          Log.e(TAG, "Interrupted while waiting for database", e);
        }
      }

      isInUse = true;
      return mDatabase;
    }

    public synchronized void releaseDatabase() {
      isInUse = false;
      notify();
    }
  }

  public UpdatesDatabase getDatabase() {
    return mDatabaseHolder.getDatabase();
  }

  public void releaseDatabase() {
    mDatabaseHolder.releaseDatabase();
  }

  /**
   * Returns the path on disk to the launch asset (JS bundle) file for the React Native host to use.
   * Blocks until the configured timeout runs out, or a new update has been downloaded and is ready
   * to use (whichever comes sooner). ReactNativeHost.getJSBundleFile() should call into this.
   *
   * If this returns null, something has gone wrong and expo-updates has not been able to launch or
   * find an update to use. In (and only in) this case, `getBundleAssetName()` will return a nonnull
   * fallback value to use.
   */
  public synchronized @Nullable String getLaunchAssetFile() {
    while (!mIsReadyToLaunch || !mTimeoutFinished) {
      try {
        wait();
      } catch (InterruptedException e) {
        Log.e(TAG, "Interrupted while waiting for launch asset file", e);
      }
    }

    mHasLaunched = true;

    if (mLauncher == null) {
      return null;
    }
    return mLauncher.getLaunchAssetFile();
  }

  /**
   * Returns the filename of the launch asset (JS bundle) file embedded in the APK bundle, which can
   * be read using `context.getAssets()`. This is only nonnull if `getLaunchAssetFile` is null and
   * should only be used in such a situation. ReactNativeHost.getBundleAssetName() should call into
   * this.
   */
  public @Nullable String getBundleAssetName() {
    if (mLauncher == null) {
      return null;
    }
    return mLauncher.getBundleAssetName();
  }

  /**
   * Returns a map of the locally downloaded assets for the current update. Keys are the remote URLs
   * of the assets and values are local paths. This should be exported by the Updates JS module and
   * can be used by `expo-asset` or a similar module to override React Native's asset resolution and
   * use the locally downloaded assets.
   */
  public @Nullable Map<AssetEntity, String> getLocalAssetFiles() {
    if (mLauncher == null) {
      return null;
    }
    return mLauncher.getLocalAssetFiles();
  }

  public boolean isUsingEmbeddedAssets() {
    if (mLauncher == null) {
      return true;
    }
    return mLauncher.isUsingEmbeddedAssets();
  }

  // other getters

  public Uri getUpdateUrl() {
    return mUpdatesConfiguration.getUpdateUrl();
  }

  public UpdatesConfiguration getUpdatesConfiguration() {
    return mUpdatesConfiguration;
  }

  public File getUpdatesDirectory() {
    return mUpdatesDirectory;
  }

  public UpdateEntity getLaunchedUpdate() {
    return mLauncher.getLaunchedUpdate();
  }

  public SelectionPolicy getSelectionPolicy() {
    return mSelectionPolicy;
  }

  public boolean isEmergencyLaunch() {
    return mIsEmergencyLaunch;
  }

  /**
   * Starts the update process to launch a previously-loaded update and (if configured to do so)
   * check for a new update from the server. This method should be called as early as possible in
   * the application's lifecycle.
   * @param context the base context of the application, ideally a {@link ReactApplication}
   */
  public synchronized void start(final Context context) {
    if (!mUpdatesConfiguration.isEnabled()) {
      mLauncher = new NoDatabaseLauncher(context);
    }
    if (mUpdatesDirectory == null) {
      mLauncher = new NoDatabaseLauncher(context, mUpdatesDirectoryException);
      mIsEmergencyLaunch = true;
    }

    if (mLauncher != null) {
      mIsReadyToLaunch = true;
      mTimeoutFinished = true;
      return;
    }

    if (mUpdatesConfiguration.getUpdateUrl() == null) {
      throw new AssertionError("expo-updates is enabled, but no valid updateUrl is configured in AndroidManifest.xml. If you are making a release build for the first time, make sure you have run `expo publish` at least once.");
    }

    boolean shouldCheckForUpdate = UpdatesUtils.shouldCheckForUpdateOnLaunch(mUpdatesConfiguration, context);
    int delay = getUpdatesConfiguration().getLaunchWaitMs();
    if (delay > 0 && shouldCheckForUpdate) {
      mHandlerThread.start();
      new Handler(mHandlerThread.getLooper()).postDelayed(this::finishTimeout, delay);
    } else {
      mTimeoutFinished = true;
    }

    UpdatesDatabase database = getDatabase();
    DatabaseLauncher launcher = new DatabaseLauncher(mUpdatesDirectory, mSelectionPolicy);
    mLauncher = launcher;
    if (mSelectionPolicy.shouldLoadNewUpdate(EmbeddedLoader.readEmbeddedManifest(context).getUpdateEntity(), launcher.getLaunchableUpdate(database, context))) {
      new EmbeddedLoader(context, database, mUpdatesDirectory).loadEmbeddedUpdate();
    }
    launcher.launch(database, context, new Launcher.LauncherCallback() {
      private void finish() {
        releaseDatabase();
        synchronized (UpdatesController.this) {
          mIsReadyToLaunch = true;
          UpdatesController.this.notify();
        }
      }

      @Override
      public void onFailure(Exception e) {
        mLauncher = new NoDatabaseLauncher(context, e);
        mIsEmergencyLaunch = true;
        finish();
      }

      @Override
      public void onSuccess() {
        finish();
      }
    });

    if (shouldCheckForUpdate) {
      AsyncTask.execute(() -> {
        UpdatesDatabase db = getDatabase();
        new RemoteLoader(context, db, mUpdatesDirectory)
            .start(getUpdateUrl(), new RemoteLoader.LoaderCallback() {
              @Override
              public void onFailure(Exception e) {
                Log.e(TAG, "Failed to download remote update", e);
                releaseDatabase();

                WritableMap params = Arguments.createMap();
                params.putString("message", e.getMessage());
                UpdatesUtils.sendEventToReactNative(mReactNativeHost, UPDATE_ERROR_EVENT, params);

                runReaper();
              }

              @Override
              public void onSuccess(@Nullable UpdateEntity update) {
                final DatabaseLauncher newLauncher = new DatabaseLauncher(mUpdatesDirectory, mSelectionPolicy);
                newLauncher.launch(database, context, new Launcher.LauncherCallback() {
                  @Override
                  public void onFailure(Exception e) {
                    releaseDatabase();
                    finishTimeout();
                    Log.e(TAG, "Loaded new update but it failed to launch", e);
                  }

                  @Override
                  public void onSuccess() {
                    releaseDatabase();

                    boolean hasLaunched = mHasLaunched;
                    if (!hasLaunched) {
                      mLauncher = newLauncher;
                    }

                    finishTimeout();

                    if (hasLaunched) {
                      if (update == null) {
                        UpdatesUtils.sendEventToReactNative(mReactNativeHost, UPDATE_NO_UPDATE_AVAILABLE_EVENT, null);
                      } else {
                        WritableMap params = Arguments.createMap();
                        params.putString("manifestString", update.metadata.toString());
                        UpdatesUtils.sendEventToReactNative(mReactNativeHost, UPDATE_AVAILABLE_EVENT, params);
                      }
                    }

                    runReaper();
                  }
                });
              }
            });
      });
    } else {
      runReaper();
    }
  }

  private synchronized void finishTimeout() {
    if (!mTimeoutFinished) {
      mTimeoutFinished = true;
      notify();
    }
    mHandlerThread.quitSafely();
  }

  private void runReaper() {
    AsyncTask.execute(() -> {
      UpdatesDatabase database = getDatabase();
      Reaper.reapUnusedUpdates(database, mUpdatesDirectory, getLaunchedUpdate(), mSelectionPolicy);
      releaseDatabase();
    });
  }

  public void relaunchReactApplication(Context context, Launcher.LauncherCallback callback) {
    if (mReactNativeHost == null || mReactNativeHost.get() == null) {
      callback.onFailure(new Exception("Could not reload application. Ensure you have passed the correct instance of ReactApplication into UpdatesController.initialize()."));
      return;
    }
    final ReactNativeHost host = mReactNativeHost.get();

    final String oldLaunchAssetFile = mLauncher.getLaunchAssetFile();

    UpdatesDatabase database = getDatabase();
    final DatabaseLauncher newLauncher = new DatabaseLauncher(mUpdatesDirectory, mSelectionPolicy);
    newLauncher.launch(database, context, new Launcher.LauncherCallback() {
      @Override
      public void onFailure(Exception e) {
        callback.onFailure(e);
      }

      @Override
      public void onSuccess() {
        mLauncher = newLauncher;
        releaseDatabase();

        final ReactInstanceManager instanceManager = host.getReactInstanceManager();

        String newLaunchAssetFile = mLauncher.getLaunchAssetFile();
        if (newLaunchAssetFile != null && !newLaunchAssetFile.equals(oldLaunchAssetFile)) {
          // Unfortunately, even though RN exposes a way to reload an application,
          // it assumes that the JS bundle will stay at the same location throughout
          // the entire lifecycle of the app. Since we need to change the location of
          // the bundle, we need to use reflection to set an otherwise inaccessible
          // field of the ReactInstanceManager.
          try {
            JSBundleLoader newJSBundleLoader = JSBundleLoader.createFileLoader(newLaunchAssetFile);
            Field jsBundleLoaderField = instanceManager.getClass().getDeclaredField("mBundleLoader");
            jsBundleLoaderField.setAccessible(true);
            jsBundleLoaderField.set(instanceManager, newJSBundleLoader);
          } catch (Exception e) {
            Log.e(TAG, "Could not reset JSBundleLoader in ReactInstanceManager", e);
          }
        }

        callback.onSuccess();

        Handler handler = new Handler(Looper.getMainLooper());
        handler.post(instanceManager::recreateReactContextInBackground);

        runReaper();
      }
    });
  }
}
