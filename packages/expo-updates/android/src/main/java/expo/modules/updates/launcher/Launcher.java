package expo.modules.updates.launcher;

import java.util.Map;

import androidx.annotation.Nullable;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;

public interface Launcher {

  interface LauncherCallback{
    void onFailure(Exception e);
    void onSuccess();
  }

  @Nullable UpdateEntity getLaunchedUpdate();
  @Nullable String getLaunchAssetFile();
  @Nullable String getBundleAssetName();
  @Nullable Map<AssetEntity, String> getLocalAssetFiles();
  boolean isUsingEmbeddedAssets();
}
