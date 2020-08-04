package expo.modules.updates.db;

import android.util.Log;

import expo.modules.updates.UpdatesConfiguration;
import expo.modules.updates.launcher.SelectionPolicy;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;

import java.io.File;
import java.util.LinkedList;
import java.util.List;

public class Reaper {

  private static String TAG = Reaper.class.getSimpleName();

  public static void reapUnusedUpdates(UpdatesConfiguration configuration, UpdatesDatabase database, File updatesDirectory, UpdateEntity launchedUpdate, SelectionPolicy selectionPolicy) {
    if (launchedUpdate == null) {
      Log.d(TAG, "Tried to reap while no update was launched; aborting");
      return;
    }

    List<UpdateEntity> allUpdates = database.updateDao().loadAllUpdatesForScope(configuration.getScopeKey());

    List<UpdateEntity> updatesToDelete = selectionPolicy.selectUpdatesToDelete(allUpdates, launchedUpdate);
    database.updateDao().deleteUpdates(updatesToDelete);

    List<AssetEntity> assetsToDelete = database.assetDao().deleteUnusedAssets();

    LinkedList<AssetEntity> erroredAssets = new LinkedList<>();

    for (AssetEntity asset : assetsToDelete) {
      if (!asset.markedForDeletion) {
        Log.e(TAG, "Tried to delete asset with URL " + asset.url + " but it was not marked for deletion");
        continue;
      }

      File path = new File(updatesDirectory, asset.relativePath);
      try {
        if (path.exists() && !path.delete()) {
          Log.e(TAG, "Failed to delete asset with URL " + asset.url + " at path " + path.toString());
          erroredAssets.add(asset);
        }
      } catch (Exception e) {
        Log.e(TAG, "Failed to delete asset with URL " + asset.url + " at path " + path.toString(), e);
        erroredAssets.add(asset);
      }
    }

    // retry failed deletions
    for (AssetEntity asset : erroredAssets) {
      File path = new File(updatesDirectory, asset.relativePath);
      try {
        if (!path.exists() || path.delete()) {
          erroredAssets.remove(asset);
        } else {
          Log.e(TAG, "Retried and failed again deleting asset with URL " + asset.url + " at path " + path.toString());
        }
      } catch (Exception e) {
        Log.e(TAG, "Retried and failed again deleting asset with URL " + asset.url + " at path " + path.toString(), e);
        erroredAssets.add(asset);
      }
    }
  }
}
