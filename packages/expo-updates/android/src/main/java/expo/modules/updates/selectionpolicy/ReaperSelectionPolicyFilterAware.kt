package expo.modules.updates.selectionpolicy

import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.db.enums.UpdateStatus
import org.json.JSONObject

private const val DEFAULT_MAX_UPDATES_TO_KEEP = 2
private const val MIN_MAX_UPDATES_TO_KEEP = 2

/**
 * ReaperSelectionPolicy which chooses which updates to delete taking into account manifest filters
 * originating from the server. If older updates are available, it will choose to keep up to
 * `maxUpdatesToKeep - 1` older updates in addition to the one currently running, preferring
 * updates that match the same filters if available.
 *
 * Uses `commitTime` to determine ordering of updates.
 *
 * Chooses only to delete updates whose scope matches that of `launchedUpdate`.
 */
class ReaperSelectionPolicyFilterAware @JvmOverloads constructor(
  private val maxUpdatesToKeep: Int = DEFAULT_MAX_UPDATES_TO_KEEP
) : ReaperSelectionPolicy {
  override fun selectUpdatesToDelete(
    updates: List<UpdateEntity>,
    launchedUpdate: UpdateEntity?,
    filters: JSONObject?
  ): List<UpdateEntity> {
    if (launchedUpdate == null) {
      return listOf()
    }
    val updatesToDelete = mutableListOf<UpdateEntity>()
    val olderUpdates = mutableListOf<UpdateEntity>()

    for (update in updates) {
      // ignore any updates whose scopeKey doesn't match that of the launched update
      if (update.scopeKey != launchedUpdate.scopeKey) {
        continue
      }
      if (update.commitTime.before(launchedUpdate.commitTime)) {
        updatesToDelete.add(update)
        olderUpdates.add(update)
      }
    }

    val maxOlderUpdatesToKeep = maxUpdatesToKeep - 1
    val olderUpdatesToKeep = olderUpdates
      .filter { SelectionPolicies.matchesFilters(it, filters) }
      .sortedByDescending { it.commitTime }
      .take(maxOlderUpdatesToKeep)
      .toMutableList()

    if (olderUpdatesToKeep.size < maxOlderUpdatesToKeep) {
      olderUpdatesToKeep.addAll(
        olderUpdates
          .filter { !olderUpdatesToKeep.contains(it) }
          .sortedByDescending { it.commitTime }
          .take(maxOlderUpdatesToKeep - olderUpdatesToKeep.size)
      )
    }
    updatesToDelete.removeAll(olderUpdatesToKeep)

    // don't delete embedded update
    return updatesToDelete.filter { it.status != UpdateStatus.EMBEDDED }
  }

  init {
    if (maxUpdatesToKeep < MIN_MAX_UPDATES_TO_KEEP) {
      throw AssertionError(
        "Cannot initialize ReaperSelectionPolicyFilterAware with maxUpdatesToKeep < $MIN_MAX_UPDATES_TO_KEEP"
      )
    }
  }
}
