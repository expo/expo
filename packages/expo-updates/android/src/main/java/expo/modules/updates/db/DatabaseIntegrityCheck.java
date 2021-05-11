package expo.modules.updates.db;

import androidx.annotation.Nullable;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.db.enums.UpdateStatus;

public class DatabaseIntegrityCheck {
  public void run(UpdatesDatabase database, File updatesDirectory, @Nullable UpdateEntity embeddedUpdate) {
    List<AssetEntity> assets = database.assetDao().loadAllAssets();

    List<AssetEntity> missingAssets = new ArrayList<>();
    for (AssetEntity asset : assets) {
      if (asset.relativePath == null || !assetExists(asset, updatesDirectory)) {
        missingAssets.add(asset);
      }
    }

    if (missingAssets.size() > 0) {
      database.updateDao().markUpdatesWithMissingAssets(missingAssets);
    }

    List<UpdateEntity> updatesToDelete = new ArrayList<>();
    // we can't run any updates with the status EMBEDDED unless they match the current embedded update
    List<UpdateEntity> updatesWithEmbeddedStatus = database.updateDao().loadAllUpdatesWithStatus(UpdateStatus.EMBEDDED);
    for (UpdateEntity update : updatesWithEmbeddedStatus) {
      if (embeddedUpdate == null || !update.id.equals(embeddedUpdate.id)) {
        updatesToDelete.add(update);
      }
    }

    if (updatesToDelete.size() > 0) {
      database.updateDao().deleteUpdates(updatesToDelete);
    }
  }

  /* package */ boolean assetExists(AssetEntity asset, File updatesDirectory) {
    File path = new File(updatesDirectory, asset.relativePath);
    return path.exists();
  }
}
