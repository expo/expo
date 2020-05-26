package expo.modules.updates;

import android.content.Context;
import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;

import java.util.HashMap;
import java.util.Map;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;

import androidx.annotation.Nullable;
import expo.modules.updates.db.UpdatesDatabase;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.launcher.Launcher;
import expo.modules.updates.loader.FileDownloader;
import expo.modules.updates.manifest.Manifest;
import expo.modules.updates.loader.RemoteLoader;

public class UpdatesModule extends ExportedModule {
  private static final String NAME = "ExpoUpdates";
  private static final String TAG = UpdatesModule.class.getSimpleName();

  private ModuleRegistry mModuleRegistry;

  public UpdatesModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  @Override
  public Map<String, Object> getConstants() {
    Map<String, Object> constants = new HashMap<>();

    try {
      UpdatesController controller = UpdatesController.getInstance();
      if (controller != null) {
        constants.put("isEmergencyLaunch", controller.isEmergencyLaunch());

        UpdateEntity launchedUpdate = controller.getLaunchedUpdate();
        if (launchedUpdate != null) {
          constants.put("updateId", launchedUpdate.id.toString());
          constants.put("manifestString", launchedUpdate.metadata != null ? launchedUpdate.metadata.toString() : "{}");
        }

        Map<AssetEntity, String> localAssetFiles = controller.getLocalAssetFiles();
        if (localAssetFiles != null) {
          Map<String, String> localAssets = new HashMap<>();
          for (AssetEntity asset : localAssetFiles.keySet()) {
            localAssets.put(asset.key, localAssetFiles.get(asset));
          }
          constants.put("localAssets", localAssets);
        }

        constants.put("isEnabled", controller.getUpdatesConfiguration().isEnabled());
        constants.put("releaseChannel", controller.getUpdatesConfiguration().getReleaseChannel());
        constants.put("isUsingEmbeddedAssets", controller.isUsingEmbeddedAssets());
      }
    } catch (IllegalStateException e) {
      // do nothing; this is expected in a development client
      constants.put("isEnabled", false);
    }

    return constants;
  }

  @ExpoMethod
  public void reload(final Promise promise) {
    try {
      UpdatesController controller = UpdatesController.getInstance();
      if (!controller.getUpdatesConfiguration().isEnabled()) {
        promise.reject("ERR_UPDATES_DISABLED", "You cannot reload when expo-updates is not enabled.");
        return;
      }

      controller.relaunchReactApplication(getContext(), new Launcher.LauncherCallback() {
        @Override
        public void onFailure(Exception e) {
          Log.e(TAG, "Failed to relaunch application", e);
          promise.reject("ERR_UPDATES_RELOAD", e.getMessage(), e);
        }

        @Override
        public void onSuccess() {
          promise.resolve(null);
        }
      });
    } catch (IllegalStateException e) {
      promise.reject(
        "ERR_UPDATES_RELOAD",
        "The updates module controller has not been properly initialized. If you're using a development client, you cannot use `Updates.reloadAsync`. Otherwise, make sure you have called the native method UpdatesController.initialize()."
      );
    }
  }

  @ExpoMethod
  public void checkForUpdateAsync(final Promise promise) {
    try {
      final UpdatesController controller = UpdatesController.getInstance();
      if (!controller.getUpdatesConfiguration().isEnabled()) {
        promise.reject("ERR_UPDATES_DISABLED", "You cannot check for updates when expo-updates is not enabled.");
        return;
      }

      FileDownloader.downloadManifest(controller.getUpdateUrl(), getContext(), new FileDownloader.ManifestDownloadCallback() {
        @Override
        public void onFailure(String message, Exception e) {
          promise.reject("ERR_UPDATES_CHECK", message, e);
          Log.e(TAG, message, e);
        }

        @Override
        public void onSuccess(Manifest manifest) {
          UpdateEntity launchedUpdate = controller.getLaunchedUpdate();
          Bundle updateInfo = new Bundle();
          if (launchedUpdate == null) {
            // this shouldn't ever happen, but if we don't have anything to compare
            // the new manifest to, let the user know an update is available
            updateInfo.putBoolean("isAvailable", true);
            updateInfo.putString("manifestString", manifest.getRawManifestJson().toString());
            promise.resolve(updateInfo);
            return;
          }

          if (controller.getSelectionPolicy().shouldLoadNewUpdate(manifest.getUpdateEntity(), launchedUpdate)) {
            updateInfo.putBoolean("isAvailable", true);
            updateInfo.putString("manifestString", manifest.getRawManifestJson().toString());
            promise.resolve(updateInfo);
          } else {
            updateInfo.putBoolean("isAvailable", false);
            promise.resolve(updateInfo);
          }
        }
      });
    } catch (IllegalStateException e) {
      promise.reject(
        "ERR_UPDATES_CHECK",
        "The updates module controller has not been properly initialized. If you're using a development client, you cannot check for updates. Otherwise, make sure you have called the native method UpdatesController.initialize()."
      );
    }
  }

  @ExpoMethod
  public void fetchUpdateAsync(final Promise promise) {
    try {
      final UpdatesController controller = UpdatesController.getInstance();
      if (!controller.getUpdatesConfiguration().isEnabled()) {
        promise.reject("ERR_UPDATES_DISABLED", "You cannot fetch updates when expo-updates is not enabled.");
        return;
      }

      AsyncTask.execute(() -> {
        UpdatesDatabase database = controller.getDatabase();
        new RemoteLoader(getContext(), database, controller.getUpdatesDirectory())
          .start(
            controller.getUpdateUrl(),
            new RemoteLoader.LoaderCallback() {
              @Override
              public void onFailure(Exception e) {
                controller.releaseDatabase();
                promise.reject("ERR_UPDATES_FETCH", "Failed to download new update", e);
              }

              @Override
              public void onSuccess(@Nullable UpdateEntity update) {
                controller.releaseDatabase();
                Bundle updateInfo = new Bundle();
                if (update == null) {
                  updateInfo.putBoolean("isNew", false);
                } else {
                  updateInfo.putBoolean("isNew", true);
                  updateInfo.putString("manifestString", update.metadata.toString());
                }
                promise.resolve(updateInfo);
              }
            }
          );
      });
    } catch (IllegalStateException e) {
      promise.reject(
        "ERR_UPDATES_FETCH",
        "The updates module controller has not been properly initialized. If you're using a development client, you cannot fetch updates. Otherwise, make sure you have called the native method UpdatesController.initialize()."
      );
    }
  }
}
