package expo.modules.updates.selectionpolicy;

import org.json.JSONObject;

import java.util.Collections;
import java.util.List;

import expo.modules.updates.db.entity.UpdateEntity;

/**
 * LauncherSelectionPolicy which chooses an update to launch based on the manifest filters
 * provided by the server. If multiple updates meet the criteria, the newest one is chosen, but the
 * manifest filters are always taken into account before the commit time.
 */
public class LauncherSelectionPolicyFilterAware implements LauncherSelectionPolicy {

  private List<String> mRuntimeVersions;

  public LauncherSelectionPolicyFilterAware(List<String> runtimeVersions) {
    mRuntimeVersions = runtimeVersions;
  }

  public LauncherSelectionPolicyFilterAware(String runtimeVersion) {
    this(Collections.singletonList(runtimeVersion));
  }

  @Override
  public UpdateEntity selectUpdateToLaunch(List<UpdateEntity> updates, JSONObject filters) {
    UpdateEntity updateToLaunch = null;
    for (UpdateEntity update : updates) {
      if (!mRuntimeVersions.contains(update.runtimeVersion) || !SelectionPolicies.matchesFilters(update, filters)) {
        continue;
      }
      if (updateToLaunch == null || updateToLaunch.commitTime.before(update.commitTime)) {
        updateToLaunch = update;
      }
    }
    return updateToLaunch;
  }
}
