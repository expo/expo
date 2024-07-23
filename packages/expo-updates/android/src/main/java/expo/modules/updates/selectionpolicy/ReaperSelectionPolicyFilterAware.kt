package expo.modules.updates.selectionpolicy

import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.db.enums.UpdateStatus
import org.json.JSONObject

/**
 * ReaperSelectionPolicy which chooses which updates to delete taking into account manifest filters
 * originating from the server. If an older update is available, it will choose to keep one older
 * update in addition to the one currently running, preferring updates that match the same filters
 * if available.
 *
 * Uses `commitTime` to determine ordering of updates.
 *
 * Chooses only to delete updates whose scope matches that of `launchedUpdate`.
 */
class ReaperSelectionPolicyFilterAware : ReaperSelectionPolicy {
  override fun selectUpdatesToDelete(
    updates: List<UpdateEntity>,
    launchedUpdate: UpdateEntity?,
    filters: JSONObject?
  ): List<UpdateEntity> {
    if (launchedUpdate == null) {
      return listOf()
    }
    val updatesToDelete = mutableListOf<UpdateEntity>()
    // keep the launched update and one other, to be safe and make roll backs faster
    // keep the next newest update that matches all the manifest filters, unless no other updates do
    // in which case, keep the next newest across all updates
    var nextNewestUpdate: UpdateEntity? = null
    var nextNewestUpdateMatchingFilters: UpdateEntity? = null
    for (update in updates) {
      // ignore any updates whose scopeKey doesn't match that of the launched update
      if (update.scopeKey != launchedUpdate.scopeKey) {
        continue
      }
      if (update.commitTime.before(launchedUpdate.commitTime)) {
        updatesToDelete.add(update)
        if (nextNewestUpdate == null || nextNewestUpdate.commitTime.before(update.commitTime)) {
          nextNewestUpdate = update
        }
        if (SelectionPolicies.matchesFilters(update, filters) &&
          (nextNewestUpdateMatchingFilters == null || nextNewestUpdateMatchingFilters.commitTime.before(update.commitTime))
        ) {
          nextNewestUpdateMatchingFilters = update
        }
      }
    }
    if (nextNewestUpdateMatchingFilters != null) {
      updatesToDelete.remove(nextNewestUpdateMatchingFilters)
    } else if (nextNewestUpdate != null) {
      updatesToDelete.remove(nextNewestUpdate)
    }

    // don't delete embedded update
    return updatesToDelete.filter { it.status != UpdateStatus.EMBEDDED }
  }
}
