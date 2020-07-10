package expo.modules.updates.loader;

import android.content.Context;
import android.os.AsyncTask;
import android.os.Handler;
import android.os.HandlerThread;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

import java.io.File;

import androidx.annotation.Nullable;
import expo.modules.updates.UpdatesConfiguration;
import expo.modules.updates.UpdatesUtils;
import expo.modules.updates.db.DatabaseHolder;
import expo.modules.updates.db.UpdatesDatabase;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.launcher.DatabaseLauncher;
import expo.modules.updates.launcher.Launcher;
import expo.modules.updates.launcher.SelectionPolicy;
import expo.modules.updates.manifest.Manifest;

public class LoaderTask {

  private static final String TAG = LoaderTask.class.getSimpleName();

  private static final String UPDATE_AVAILABLE_EVENT = "updateAvailable";
  private static final String UPDATE_NO_UPDATE_AVAILABLE_EVENT = "noUpdateAvailable";
  private static final String UPDATE_ERROR_EVENT = "error";

  public interface LoaderTaskCallback {
    void onFailure(Exception e);
    void onManifestLoaded(Manifest manifest);
    void onSuccess(Launcher launcher);
    void onEvent(String eventName, WritableMap params);
  }

  private interface Callback {
    void onFailure(Exception e);
    void onSuccess();
  }

  private UpdatesConfiguration mConfiguration;
  private DatabaseHolder mDatabaseHolder;
  private File mDirectory;
  private SelectionPolicy mSelectionPolicy;
  private LoaderTaskCallback mCallback;

  // success conditions
  private boolean mIsReadyToLaunch = false;
  private boolean mTimeoutFinished = false;
  private boolean mHasLaunched = false;
  private HandlerThread mHandlerThread;
  private Launcher mLauncher;

  public LoaderTask(UpdatesConfiguration configuration,
                    DatabaseHolder databaseHolder,
                    File directory,
                    SelectionPolicy selectionPolicy,
                    LoaderTaskCallback callback) {
    mConfiguration = configuration;
    mDatabaseHolder = databaseHolder;
    mDirectory = directory;
    mSelectionPolicy = selectionPolicy;
    mCallback = callback;

    mHandlerThread = new HandlerThread("expo-updates-timer");
  }

  public void start(Context context) {
    if (!mConfiguration.isEnabled()) {
      mCallback.onFailure(new Exception("LoaderTask was passed a configuration object with updates disabled. You should load updates from an embedded source rather than calling LoaderTask, or enable updates in the configuration."));
      return;
    }

    if (mConfiguration.getUpdateUrl() == null) {
      mCallback.onFailure(new Exception("LoaderTask was passed a configuration object with a null URL. You must pass a nonnull URL in order to use LoaderTask to load updates."));
      return;
    }

    if (mDirectory == null) {
      throw new AssertionError("LoaderTask directory must be nonnull.");
    }

    boolean shouldCheckForUpdate = UpdatesUtils.shouldCheckForUpdateOnLaunch(mConfiguration, context);
    int delay = mConfiguration.getLaunchWaitMs();
    if (delay > 0 && shouldCheckForUpdate) {
      mHandlerThread.start();
      new Handler(mHandlerThread.getLooper()).postDelayed(this::timeout, delay);
    } else {
      mTimeoutFinished = true;
    }

    launchFallbackUpdateFromDisk(context, new Callback() {
      @Override
      public void onFailure(Exception e) {
        // An unexpected failure has occurred here, or we are running in an environment with no
        // embedded update and we have no update downloaded (e.g. Expo client).
        // What to do in this case depends on whether or not we're trying to load a remote update.
        // If we are, then we should wait for the task to finish. If not, we need to fail here.
        if (!shouldCheckForUpdate) {
          finish(e);
        }
        Log.e(TAG, "Failed to launch embedded or launchable update", e);
      }

      @Override
      public void onSuccess() {
        synchronized (LoaderTask.this) {
          mIsReadyToLaunch = true;
          maybeFinish();
        }
      }
    });

    if (shouldCheckForUpdate) {
      launchRemoteUpdateInBackground(context, new Callback() {
        @Override
        public void onFailure(Exception e) {
          finish(e);
        }

        @Override
        public void onSuccess() {
          finish(null);
        }
      });
    }
  }

  /**
   * This method should be called at the end of the LoaderTask. Whether or not the task has
   * successfully loaded an update to launch, the timer will stop and the appropriate callback
   * function will be fired.
   */
  private synchronized void finish(@Nullable Exception e) {
    if (mHasLaunched) {
      // we've already fired once, don't do it again
    }
    mHasLaunched = true;

    if (!mIsReadyToLaunch || mLauncher == null) {
      mCallback.onFailure(e != null ? e : new Exception("LoaderTask encountered an unexpected error and could not launch an update."));
    } else {
      mCallback.onSuccess(mLauncher);
    }

    if (!mTimeoutFinished) {
      stopTimer();
    }
  }

  /**
   * This method should be called to conditionally fire the callback. If the task has successfully
   * loaded an update to launch and the timer isn't still running, the appropriate callback function
   * will be fired. If not, no callback will be fired.
   */
  private void maybeFinish() {
    if (!mIsReadyToLaunch || !mTimeoutFinished) {
      // too early, bail out
      return;
    }
    finish(null);
  }

  private synchronized void stopTimer() {
    mTimeoutFinished = true;
    mHandlerThread.quitSafely();
  }

  private synchronized void timeout() {
    if (!mTimeoutFinished) {
      mTimeoutFinished = true;
      maybeFinish();
    }
    stopTimer();
  }

  private void launchFallbackUpdateFromDisk(Context context, Callback diskUpdateCallback) {
    UpdatesDatabase database = mDatabaseHolder.getDatabase();
    DatabaseLauncher launcher = new DatabaseLauncher(mDirectory, mSelectionPolicy);
    mLauncher = launcher;

    // if the embedded update should be launched (e.g. if it's newer than any other update we have
    // in the database, which can happen if the app binary is updated), load it into the database
    // so we can launch it
    UpdateEntity embeddedUpdate = EmbeddedLoader.readEmbeddedManifest(context).getUpdateEntity();
    UpdateEntity launchableUpdate = launcher.getLaunchableUpdate(database, context);
    if (mSelectionPolicy.shouldLoadNewUpdate(embeddedUpdate, launchableUpdate)) {
      new EmbeddedLoader(context, database, mDirectory).loadEmbeddedUpdate();
    }

    launcher.launch(database, context, new Launcher.LauncherCallback() {
      @Override
      public void onFailure(Exception e) {
        mDatabaseHolder.releaseDatabase();
        diskUpdateCallback.onFailure(e);
      }

      @Override
      public void onSuccess() {
        mDatabaseHolder.releaseDatabase();
        diskUpdateCallback.onSuccess();
      }
    });
  }

  private void launchRemoteUpdateInBackground(Context context, Callback remoteUpdateCallback) {
    AsyncTask.execute(() -> {
      UpdatesDatabase database = mDatabaseHolder.getDatabase();
      new RemoteLoader(context, database, mDirectory)
        .start(mConfiguration.getUpdateUrl(), new RemoteLoader.LoaderCallback() {
          @Override
          public void onFailure(Exception e) {
            mDatabaseHolder.releaseDatabase();
            remoteUpdateCallback.onFailure(e);

            WritableMap params = Arguments.createMap();
            params.putString("message", e.getMessage());
            mCallback.onEvent(UPDATE_ERROR_EVENT, params);

            Log.e(TAG, "Failed to download remote update", e);
          }

          @Override
          public void onSuccess(@Nullable UpdateEntity update) {
            // a new update has loaded successfully; we need to launch it with a new Launcher and
            // replace the old Launcher so that the callback fires with the new one
            final DatabaseLauncher newLauncher = new DatabaseLauncher(mDirectory, mSelectionPolicy);
            newLauncher.launch(database, context, new Launcher.LauncherCallback() {
              @Override
              public void onFailure(Exception e) {
                mDatabaseHolder.releaseDatabase();
                remoteUpdateCallback.onFailure(e);
                Log.e(TAG, "Loaded new update but it failed to launch", e);
              }

              @Override
              public void onSuccess() {
                mDatabaseHolder.releaseDatabase();

                boolean hasLaunched = mHasLaunched;
                if (!hasLaunched) {
                  mLauncher = newLauncher;
                }

                remoteUpdateCallback.onSuccess();

                if (hasLaunched) {
                  if (update == null) {
                    mCallback.onEvent(UPDATE_NO_UPDATE_AVAILABLE_EVENT, null);
                  } else {
                    WritableMap params = Arguments.createMap();
                    params.putString("manifestString", update.metadata.toString());
                    mCallback.onEvent(UPDATE_AVAILABLE_EVENT, params);
                  }
                }
              }
            });
          }
        });
    });
  }
}
