package expo.modules.updates.launcher;

import android.util.Log;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;

import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.manifest.Manifest;

/**
 * Update selection policy which chooses an update to launch based on the manifest filters
 * provided by the server. If multiple updates meet the criteria, the newest one is chosen, but the
 * manifest filters are always taken into account before the commit time.
 */
public class SelectionPolicyFilterAware implements SelectionPolicy {

  private static final String TAG = SelectionPolicyFilterAware.class.getSimpleName();

  private List<String> mRuntimeVersions;

  public SelectionPolicyFilterAware(List<String> runtimeVersions) {
    mRuntimeVersions = runtimeVersions;
  }

  public SelectionPolicyFilterAware(String runtimeVersion) {
    this(Collections.singletonList(runtimeVersion));
  }

  @Override
  public UpdateEntity selectUpdateToLaunch(List<UpdateEntity> updates, JSONObject filters) {
    UpdateEntity updateToLaunch = null;
    for (UpdateEntity update : updates) {
      if (!mRuntimeVersions.contains(update.runtimeVersion) || !matchesFilters(update, filters)) {
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
    // keep the launched update and one other, to be safe and make rollbacks faster
    // keep the next newest update that matches all the manifest filters, unless no other updates do
    // in which case, keep the next newest across all updates
    UpdateEntity nextNewestUpdate = null;
    UpdateEntity nextNewestUpdateMatchingFilters = null;
    for (UpdateEntity update : updates) {
      if (update.commitTime.before(launchedUpdate.commitTime)) {
        updatesToDelete.add(update);
        if (nextNewestUpdate == null || nextNewestUpdate.commitTime.before(update.commitTime)) {
          nextNewestUpdate = update;
        }
        if (matchesFilters(update, filters) &&
          (nextNewestUpdateMatchingFilters == null ||  nextNewestUpdateMatchingFilters.commitTime.before(update.commitTime))) {
          nextNewestUpdateMatchingFilters = update;
        }
      }
    }

    if (nextNewestUpdateMatchingFilters != null) {
      updatesToDelete.remove(nextNewestUpdateMatchingFilters);
    } else if (nextNewestUpdate != null) {
      updatesToDelete.remove(nextNewestUpdate);
    }
    return updatesToDelete;
  }

  @Override
  public boolean shouldLoadNewUpdate(UpdateEntity newUpdate, UpdateEntity launchedUpdate, JSONObject filters) {
    if (newUpdate == null) {
      return false;
    }
    // if the new update doesn't pass its own manifest filters, we shouldn't load it
    if (!matchesFilters(newUpdate, filters)) {
      return false;
    }

    if (launchedUpdate == null) {
      return true;
    }
    // if the current update doesn't pass the manifest filters
    // we should load the new update no matter the commitTime
    if (!matchesFilters(launchedUpdate, filters)) {
      return true;
    }
    return newUpdate.commitTime.after(launchedUpdate.commitTime);
  }

  /* package */ boolean matchesFilters(UpdateEntity update, JSONObject manifestFilters) {
    if (manifestFilters == null || update.metadata == null || !update.metadata.has("updateMetadata")) {
      // empty matches all
      return true;
    }
    try {
      JSONObject updateMetadata = update.metadata.getJSONObject("updateMetadata");
      Iterator<String> keySet = manifestFilters.keys();
      while (keySet.hasNext()) {
        String key = keySet.next();
        // once an update fails one filter, break early; we don't need to check the rest
        if (updateMetadata.has(key) && !manifestFilters.get(key).equals(updateMetadata.get(key))) {
          return false;
        }
      }
    } catch (Exception e) {
      Log.e(TAG, "Error filtering manifest using server data", e);
      return true;
    }
    return true;
  }
}
