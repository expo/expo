package expo.modules.updates;

import java.io.File;
import java.util.Map;

import expo.modules.updates.db.DatabaseHolder;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.launcher.Launcher;
import expo.modules.updates.launcher.SelectionPolicy;

public interface UpdatesInterface {

  UpdatesConfiguration getConfiguration();
  SelectionPolicy getSelectionPolicy();
  File getDirectory();
  DatabaseHolder getDatabaseHolder();

  boolean isEmergencyLaunch();
  boolean isUsingEmbeddedAssets();
  UpdateEntity getLaunchedUpdate();
  Map<AssetEntity, String> getLocalAssetFiles();

  void relaunchReactApplication(Launcher.LauncherCallback callback);
}
