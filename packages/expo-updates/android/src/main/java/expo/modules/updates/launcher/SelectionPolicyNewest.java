package expo.modules.updates.launcher;

import org.json.JSONObject;

import expo.modules.updates.db.entity.UpdateEntity;

import java.util.ArrayList;
import java.util.Arrays;
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

  private List<String> mRuntimeVersions;

  public SelectionPolicyNewest(List<String> runtimeVersions) {
    mRuntimeVersions = runtimeVersions;
  }

  public SelectionPolicyNewest(String runtimeVersion) {
    mRuntimeVersions = Arrays.asList(runtimeVersion);
  }

  @Override
  public UpdateEntity selectUpdateToLaunch(List<UpdateEntity> updates, JSONObject filters) {
    UpdateEntity updateToLaunch = null;
    for (UpdateEntity update : updates) {
      if (!mRuntimeVersions.contains(update.runtimeVersion)) {
        continue;
      }
      if (updateToLaunch == null || updateToLaunch.commitTime.before(update.commitTime)) {
        updateToLaunch = update;
      }
    }
    return updateToLaunch;
  }

  @Override
  public List<UpdateEntity> selectUpdatesToDelete(List<UpdateEntity> updates, UpdateEntity launchedUpdate, JSONObject filters) {
    if (launchedUpdate == null) {
      return new ArrayList<>();
    }

    List<UpdateEntity> updatesToDelete = new ArrayList<>();
    // keep the launched update and one other, the next newest, to be safe and make rollbacks faster
    UpdateEntity nextNewestUpdate = null;
    for (UpdateEntity update : updates) {
      if (update.commitTime.before(launchedUpdate.commitTime)) {
        updatesToDelete.add(update);
        if (nextNewestUpdate == null || nextNewestUpdate.commitTime.before(update.commitTime)) {
          nextNewestUpdate = update;
        }
      }
    }

    if (nextNewestUpdate != null) {
      updatesToDelete.remove(nextNewestUpdate);
    }
    return updatesToDelete;
  }

  @Override
  public boolean shouldLoadNewUpdate(UpdateEntity newUpdate, UpdateEntity launchedUpdate, JSONObject filters) {
    if (launchedUpdate == null) {
      return true;
    }
    if (newUpdate == null) {
      return false;
    }
    return newUpdate.commitTime.after(launchedUpdate.commitTime);
  }
}
