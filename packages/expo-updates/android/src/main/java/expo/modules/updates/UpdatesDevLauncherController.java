package expo.modules.updates;

import android.content.Context;

import androidx.annotation.Nullable;

import org.json.JSONObject;

import java.util.HashMap;

import expo.modules.manifests.core.Manifest;
import expo.modules.updates.db.DatabaseHolder;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.launcher.DatabaseLauncher;
import expo.modules.updates.launcher.Launcher;
import expo.modules.updates.loader.RemoteLoader;
import expo.modules.updates.manifest.ManifestFactory;
import expo.modules.updates.manifest.UpdateManifest;
import expo.modules.updates.selectionpolicy.ReaperSelectionPolicyDevelopmentClient;
import expo.modules.updates.selectionpolicy.SelectionPolicy;
import expo.modules.updatesinterface.UpdatesInterface;

// this unused import must stay because of versioning
import expo.modules.updates.UpdatesConfiguration;

public class UpdatesDevLauncherController implements UpdatesInterface {

  private static UpdatesDevLauncherController sInstance;

  private UpdatesConfiguration mTempConfiguration;

  public static UpdatesDevLauncherController getInstance() {
    if (sInstance == null) {
      throw new IllegalStateException("UpdatesDevLauncherController.getInstance() was called before the module was initialized");
    }
    return sInstance;
  }

  public static UpdatesDevLauncherController initialize(Context context) {
    if (sInstance == null) {
      sInstance = new UpdatesDevLauncherController();
    }
    UpdatesController.initializeWithoutStarting(context);
    return getInstance();
  }

  private static void setDevelopmentSelectionPolicy() {
    UpdatesController controller = UpdatesController.getInstance();
    SelectionPolicy currentSelectionPolicy = controller.getSelectionPolicy();
    controller.setDefaultSelectionPolicy(new SelectionPolicy(
            currentSelectionPolicy.getLauncherSelectionPolicy(),
            currentSelectionPolicy.getLoaderSelectionPolicy(),
            new ReaperSelectionPolicyDevelopmentClient()
    ));
    controller.resetSelectionPolicyToDefault();
  }

  @Override
  public void reset() {
    UpdatesController controller = UpdatesController.getInstance();
    controller.setLauncher(null);
  }

  @Override
  public void fetchUpdateWithConfiguration(HashMap<String, Object> configuration, Context context, UpdateCallback callback) {
    UpdatesController controller = UpdatesController.getInstance();
    UpdatesConfiguration updatesConfiguration = new UpdatesConfiguration()
            .loadValuesFromMetadata(context)
            .loadValuesFromMap(configuration);
    if (updatesConfiguration.getUpdateUrl() == null || updatesConfiguration.getScopeKey() == null) {
      callback.onFailure(new Exception("Failed to load update: UpdatesConfiguration object must include a valid update URL"));
      return;
    }
    if (controller.getUpdatesDirectory() == null) {
      callback.onFailure(controller.getUpdatesDirectoryException());
      return;
    }

    // since controller is a singleton, save its config so we can reset to it if our request fails
    mTempConfiguration = controller.getUpdatesConfiguration();

    setDevelopmentSelectionPolicy();
    controller.setUpdatesConfiguration(updatesConfiguration);

    DatabaseHolder databaseHolder = controller.getDatabaseHolder();
    RemoteLoader loader = new RemoteLoader(context, updatesConfiguration, databaseHolder.getDatabase(), controller.getFileDownloader(), controller.getUpdatesDirectory());
    loader.start(new RemoteLoader.LoaderCallback() {
      @Override
      public void onFailure(Exception e) {
        databaseHolder.releaseDatabase();
        callback.onFailure(e);
      }

      @Override
      public void onSuccess(@Nullable UpdateEntity update) {
        databaseHolder.releaseDatabase();
        if (update == null) {
          callback.onSuccess(null);
          return;
        }
        launchNewestUpdate(updatesConfiguration, context, callback);
      }

      @Override
      public void onAssetLoaded(AssetEntity asset, int successfulAssetCount, int failedAssetCount, int totalAssetCount) {
        callback.onProgress(successfulAssetCount, failedAssetCount, totalAssetCount);
      }

      @Override
      public boolean onUpdateManifestLoaded(UpdateManifest updateManifest) {
        return callback.onManifestLoaded(updateManifest.getManifest().getRawJson());
      }
    });
  }

  private void launchNewestUpdate(UpdatesConfiguration configuration, Context context, UpdateCallback callback) {
    UpdatesController controller = UpdatesController.getInstance();
    DatabaseHolder databaseHolder = controller.getDatabaseHolder();
    DatabaseLauncher launcher = new DatabaseLauncher(configuration, controller.getUpdatesDirectory(), controller.getFileDownloader(), controller.getSelectionPolicy());
    launcher.launch(databaseHolder.getDatabase(), context, new Launcher.LauncherCallback() {
      @Override
      public void onFailure(Exception e) {
        databaseHolder.releaseDatabase();
        callback.onFailure(e);
        // reset controller's configuration to what it was before this request
        controller.setUpdatesConfiguration(mTempConfiguration);
      }

      @Override
      public void onSuccess() {
        databaseHolder.releaseDatabase();
        controller.setLauncher(launcher);
        callback.onSuccess(new Update() {
          @Override
          public JSONObject getManifest() {
            Manifest manifest = Manifest.fromManifestJson(launcher.getLaunchedUpdate().manifest);
            return manifest.getRawJson();
          }

          @Override
          public String getLaunchAssetPath() {
            return launcher.getLaunchAssetFile();
          }
        });
        controller.runReaper();
      }
    });
  }
}
