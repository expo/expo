package expo.modules.updates;

import java.io.File;
import java.util.Map;

// this unused import must stay because of versioning
import expo.modules.updates.UpdatesConfiguration;

import expo.modules.updates.db.DatabaseHolder;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.launcher.Launcher;
import expo.modules.updates.selectionpolicy.SelectionPolicy;
import expo.modules.updates.loader.FileDownloader;

public interface UpdatesInterface {

  UpdatesConfiguration getConfiguration();
  SelectionPolicy getSelectionPolicy();
  File getDirectory();
  DatabaseHolder getDatabaseHolder();
  FileDownloader getFileDownloader();

  boolean isEmergencyLaunch();
  boolean isUsingEmbeddedAssets();
  boolean canRelaunch();
  UpdateEntity getLaunchedUpdate();
  Map<AssetEntity, String> getLocalAssetFiles();

  void relaunchReactApplication(Launcher.LauncherCallback callback);
  void resetSelectionPolicy();
}
