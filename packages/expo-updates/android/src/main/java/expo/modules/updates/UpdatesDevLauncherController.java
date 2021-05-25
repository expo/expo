package expo.modules.updates;

import android.content.Context;

import androidx.annotation.Nullable;

import org.json.JSONObject;

import java.util.HashMap;

import expo.modules.updates.db.DatabaseHolder;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.launcher.DatabaseLauncher;
import expo.modules.updates.launcher.Launcher;
import expo.modules.updates.loader.RemoteLoader;
import expo.modules.updates.manifest.Manifest;
import expo.modules.updates.selectionpolicy.ReaperSelectionPolicyDevelopmentClient;
import expo.modules.updates.selectionpolicy.SelectionPolicy;
import expo.modules.updatesinterface.UpdatesInterface;

public class UpdatesDevLauncherController implements UpdatesInterface {

  private JSONObject mRawManifest;

  public UpdatesDevLauncherController(Context context) {
    UpdatesController.initializeInternal(context);
    setDevelopmentSelectionPolicy();
  }

  private void setDevelopmentSelectionPolicy() {
    UpdatesController controller = UpdatesController.getInstance();
    SelectionPolicy currentSelectionPolicy = controller.getSelectionPolicy();
    controller.setDefaultSelectionPolicy(new SelectionPolicy(
            currentSelectionPolicy.getLauncherSelectionPolicy(),
            currentSelectionPolicy.getLoaderSelectionPolicy(),
            new ReaperSelectionPolicyDevelopmentClient()
    ));
  }

  private void reset() {
    mRawManifest = null;
  }

  @Override
  public void fetchUpdateWithConfiguration(HashMap<String, Object> configuration, Context context, UpdateCallback callback) {
    reset();

    UpdatesController controller = UpdatesController.getInstance();
    UpdatesConfiguration updatesConfiguration = new UpdatesConfiguration()
            .loadValuesFromMetadata(context)
            .loadValuesFromMap(configuration);
    if (updatesConfiguration.getUpdateUrl() == null) {
      callback.onFailure(new Exception("Failed to load update: UpdatesConfiguration object must include a valid update URL"));
      return;
    }
    if (controller.getUpdatesDirectory() == null) {
      callback.onFailure(controller.getUpdatesDirectoryException());
      return;
    }

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
        if (update != null) {
          DatabaseLauncher launcher = new DatabaseLauncher(updatesConfiguration, controller.getUpdatesDirectory(), controller.getFileDownloader(), controller.getSelectionPolicy());
          launcher.launch(databaseHolder.getDatabase(), context, new Launcher.LauncherCallback() {
            @Override
            public void onFailure(Exception e) {
              databaseHolder.releaseDatabase();
              callback.onFailure(e);
            }

            @Override
            public void onSuccess() {
              databaseHolder.releaseDatabase();
              controller.setLauncher(launcher);
              controller.setUpdatesConfiguration(updatesConfiguration);
              callback.onSuccess(new Update() {
                @Override
                public JSONObject getManifest() {
                  return mRawManifest;
                }

                @Override
                public String getLaunchAssetPath() {
                  return launcher.getLaunchAssetFile();
                }
              });
            }
          });
        }
      }

      @Override
      public void onAssetLoaded(AssetEntity asset, int successfulAssetCount, int failedAssetCount, int totalAssetCount) {
        callback.onProgress(successfulAssetCount, failedAssetCount, totalAssetCount);
      }

      @Override
      public boolean onManifestLoaded(Manifest manifest) {
        mRawManifest = manifest.getRawManifest().getRawJson();
        return callback.onManifestLoaded(mRawManifest);
      }
    });
  }
}
