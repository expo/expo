package expo.modules.updates.selectionpolicy;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import expo.modules.updates.db.entity.UpdateEntity;

/**
 * ReaperSelectionPolicy which chooses which updates to delete taking into account manifest filters
 * originating from the server. If an older update is available, it will choose to keep one older
 * update in addition to the one currently running, preferring updates that match the same filters
 * if available.
 *
 * Chooses only to delete updates whose scope matches that of `launchedUpdate`.
 */
public class ReaperSelectionPolicyFilterAware implements ReaperSelectionPolicy {

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
      // ignore any updates whose scopeKey doesn't match that of the launched update
      if (!update.scopeKey.equals(launchedUpdate.scopeKey)) {
        continue;
      }
      if (update.commitTime.before(launchedUpdate.commitTime)) {
        updatesToDelete.add(update);
        if (nextNewestUpdate == null || nextNewestUpdate.commitTime.before(update.commitTime)) {
          nextNewestUpdate = update;
        }
        if (SelectionPolicies.matchesFilters(update, filters) &&
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
}
