package expo.modules.updates.launcher;

import expo.modules.updates.db.entity.UpdateEntity;

import java.util.ArrayList;
import java.util.List;

/**
 * Simple Update selection policy which chooses
 * the newest update (based on commit time) out
 * of all the possible stored updates.
 *
 * If multiple updates have the same (most
 * recent) commit time, this class will return
 * the earliest one in the list.
 */
public class SelectionPolicyNewest implements SelectionPolicy {

  private String mRuntimeVersion;

  public SelectionPolicyNewest(String runtimeVersion) {
    mRuntimeVersion = runtimeVersion;
  }

  @Override
  public UpdateEntity selectUpdateToLaunch(List<UpdateEntity> updates) {
    UpdateEntity updateToLaunch = null;
    for (UpdateEntity update : updates) {
      if (!mRuntimeVersion.equals(update.runtimeVersion)) {
        continue;
      }
      if (updateToLaunch == null || updateToLaunch.commitTime.before(update.commitTime)) {
        updateToLaunch = update;
      }
    }
    return updateToLaunch;
  }

  @Override
  public List<UpdateEntity> selectUpdatesToDelete(List<UpdateEntity> updates, UpdateEntity launchedUpdate) {
    if (launchedUpdate == null) {
      return new ArrayList<>();
    }

    List<UpdateEntity> updatesToDelete = new ArrayList<>();
    for (UpdateEntity update : updates) {
      if (update.commitTime.before(launchedUpdate.commitTime)) {
        updatesToDelete.add(update);
      }
    }
    return updatesToDelete;
  }

  @Override
  public boolean shouldLoadNewUpdate(UpdateEntity newUpdate, UpdateEntity launchedUpdate) {
    if (launchedUpdate == null) {
      return true;
    }
    if (newUpdate == null) {
      return false;
    }
    return newUpdate.commitTime.after(launchedUpdate.commitTime);
  }
}
