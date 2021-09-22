package expo.modules.updates;

import android.content.Context;
import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;

import java.util.HashMap;
import java.util.Map;

import org.json.JSONObject;
import expo.modules.core.ExportedModule;
import expo.modules.core.ModuleRegistry;
import expo.modules.core.Promise;
import expo.modules.core.interfaces.ExpoMethod;

import androidx.annotation.Nullable;
import expo.modules.updates.db.DatabaseHolder;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.launcher.Launcher;
import expo.modules.updates.loader.FileDownloader;
import expo.modules.updates.manifest.UpdateManifest;
import expo.modules.updates.loader.RemoteLoader;
import expo.modules.updates.manifest.ManifestMetadata;

// this unused import must stay because of versioning
import expo.modules.updates.UpdatesConfiguration;

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

  private UpdatesInterface getUpdatesService() {
    return mModuleRegistry.getModule(UpdatesInterface.class);
  }

  @Override
  public Map<String, Object> getConstants() {
    Map<String, Object> constants = new HashMap<>();

    try {
      UpdatesInterface updatesService = getUpdatesService();
      if (updatesService != null) {
        constants.put("isEmergencyLaunch", updatesService.isEmergencyLaunch());
        constants.put("isMissingRuntimeVersion", updatesService.getConfiguration().isMissingRuntimeVersion());

        UpdateEntity launchedUpdate = updatesService.getLaunchedUpdate();
        if (launchedUpdate != null) {
          constants.put("updateId", launchedUpdate.id.toString());
          constants.put("manifestString", launchedUpdate.manifest != null ? launchedUpdate.manifest.toString() : "{}");
        }

        Map<AssetEntity, String> localAssetFiles = updatesService.getLocalAssetFiles();
        if (localAssetFiles != null) {
          Map<String, String> localAssets = new HashMap<>();
          for (AssetEntity asset : localAssetFiles.keySet()) {
            if (asset.key != null) {
              localAssets.put(asset.key, localAssetFiles.get(asset));
            }
          }
          constants.put("localAssets", localAssets);
        }

        constants.put("isEnabled", updatesService.getConfiguration().isEnabled());
        constants.put("releaseChannel", updatesService.getConfiguration().getReleaseChannel());
        constants.put("isUsingEmbeddedAssets", updatesService.isUsingEmbeddedAssets());
      }
    } catch (Exception e) {
      // do nothing; this is expected in a development client
      constants.put("isEnabled", false);

      // In a development client, we normally don't have access to the updates configuration, but
      // we should attempt to see if the runtime/sdk versions are defined in AndroidManifest.xml
      // and warn the developer if not. This does not take into account any extra configuration
      // provided at runtime in MainApplication.java, because we don't have access to that in a
      // debug build.
      UpdatesConfiguration configuration = new UpdatesConfiguration().loadValuesFromMetadata(getContext());
      constants.put("isMissingRuntimeVersion", configuration.isMissingRuntimeVersion());
    }

    return constants;
  }

  @ExpoMethod
  public void reload(final Promise promise) {
    try {
      UpdatesInterface updatesService = getUpdatesService();
      if (!updatesService.canRelaunch()) {
        promise.reject("ERR_UPDATES_DISABLED", "You cannot reload when expo-updates is not enabled.");
        return;
      }

      updatesService.relaunchReactApplication(new Launcher.LauncherCallback() {
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
      final UpdatesInterface updatesService = getUpdatesService();
      if (!updatesService.getConfiguration().isEnabled()) {
        promise.reject("ERR_UPDATES_DISABLED", "You cannot check for updates when expo-updates is not enabled.");
        return;
      }

      DatabaseHolder databaseHolder = updatesService.getDatabaseHolder();
      JSONObject extraHeaders = ManifestMetadata.getServerDefinedHeaders(databaseHolder.getDatabase(), updatesService.getConfiguration());
      databaseHolder.releaseDatabase();

      updatesService.getFileDownloader().downloadManifest(updatesService.getConfiguration(), extraHeaders, getContext(), new FileDownloader.ManifestDownloadCallback() {
        @Override
        public void onFailure(String message, Exception e) {
          promise.reject("ERR_UPDATES_CHECK", message, e);
          Log.e(TAG, message, e);
        }

        @Override
        public void onSuccess(UpdateManifest updateManifest) {
          UpdateEntity launchedUpdate = updatesService.getLaunchedUpdate();
          Bundle updateInfo = new Bundle();
          if (launchedUpdate == null) {
            // this shouldn't ever happen, but if we don't have anything to compare
            // the new manifest to, let the user know an update is available
            updateInfo.putBoolean("isAvailable", true);
            updateInfo.putString("manifestString", updateManifest.getManifest().toString());
            promise.resolve(updateInfo);
            return;
          }

          if (updatesService.getSelectionPolicy().shouldLoadNewUpdate(updateManifest.getUpdateEntity(), launchedUpdate, updateManifest.getManifestFilters())) {
            updateInfo.putBoolean("isAvailable", true);
            updateInfo.putString("manifestString", updateManifest.getManifest().toString());
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
      final UpdatesInterface updatesService = getUpdatesService();
      if (!updatesService.getConfiguration().isEnabled()) {
        promise.reject("ERR_UPDATES_DISABLED", "You cannot fetch updates when expo-updates is not enabled.");
        return;
      }

      AsyncTask.execute(() -> {
        final DatabaseHolder databaseHolder = updatesService.getDatabaseHolder();
        new RemoteLoader(getContext(), updatesService.getConfiguration(), databaseHolder.getDatabase(), updatesService.getFileDownloader(), updatesService.getDirectory())
          .start(
            new RemoteLoader.LoaderCallback() {
              @Override
              public void onFailure(Exception e) {
                databaseHolder.releaseDatabase();
                promise.reject("ERR_UPDATES_FETCH", "Failed to download new update", e);
              }

              @Override
              public void onAssetLoaded(AssetEntity asset, int successfulAssetCount, int failedAssetCount, int totalAssetCount) {
              }

              @Override
              public boolean onUpdateManifestLoaded(UpdateManifest updateManifest) {
                return updatesService.getSelectionPolicy().shouldLoadNewUpdate(
                  updateManifest.getUpdateEntity(),
                  updatesService.getLaunchedUpdate(),
                  updateManifest.getManifestFilters());
              }

              @Override
              public void onSuccess(@Nullable UpdateEntity update) {
                databaseHolder.releaseDatabase();
                Bundle updateInfo = new Bundle();
                if (update == null) {
                  updateInfo.putBoolean("isNew", false);
                } else {
                  updatesService.resetSelectionPolicy();
                  updateInfo.putBoolean("isNew", true);
                  updateInfo.putString("manifestString", update.manifest.toString());
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
