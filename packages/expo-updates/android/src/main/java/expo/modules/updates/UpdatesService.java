package expo.modules.updates;

import android.content.Context;

import org.unimodules.core.interfaces.InternalModule;

import java.io.File;
import java.util.Collections;
import java.util.List;
import java.util.Map;

// these unused imports must stay because of versioning
import expo.modules.updates.UpdatesConfiguration;
import expo.modules.updates.UpdatesController;

import expo.modules.updates.db.DatabaseHolder;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.launcher.Launcher;
import expo.modules.updates.launcher.SelectionPolicy;

public class UpdatesService implements InternalModule, UpdatesInterface {

  private static final String TAG = UpdatesService.class.getSimpleName();

  protected Context mContext;

  public UpdatesService(Context context) {
    super();
    mContext = context;
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList((Class) UpdatesInterface.class);
  }

  @Override
  public UpdatesConfiguration getConfiguration() {
    return UpdatesController.getInstance().getUpdatesConfiguration();
  }

  @Override
  public SelectionPolicy getSelectionPolicy() {
    return UpdatesController.getInstance().getSelectionPolicy();
  }

  @Override
  public File getDirectory() {
    return UpdatesController.getInstance().getUpdatesDirectory();
  }

  @Override
  public DatabaseHolder getDatabaseHolder() {
    return UpdatesController.getInstance().getDatabaseHolder();
  }

  @Override
  public boolean isEmergencyLaunch() {
    return UpdatesController.getInstance().isEmergencyLaunch();
  }

  @Override
  public boolean isUsingEmbeddedAssets() {
    return UpdatesController.getInstance().isUsingEmbeddedAssets();
  }

  @Override
  public boolean canRelaunch() {
    return getConfiguration().isEnabled();
  }

  @Override
  public UpdateEntity getLaunchedUpdate() {
    return UpdatesController.getInstance().getLaunchedUpdate();
  }

  @Override
  public Map<AssetEntity, String> getLocalAssetFiles() {
    return UpdatesController.getInstance().getLocalAssetFiles();
  }

  @Override
  public void relaunchReactApplication(Launcher.LauncherCallback callback) {
    UpdatesController.getInstance().relaunchReactApplication(mContext, callback);
  }
}
