package expo.modules.updates.selectionpolicy

import expo.modules.updates.db.entity.UpdateEntity
import org.json.JSONObject
import java.lang.AssertionError
import java.util.*

private const val DEFAULT_MAX_UPDATES_TO_KEEP = 10

/**
 * ReaperSelectionPolicy which keeps a predefined maximum number of updates across all scopes, and,
 * once that number is surpassed, selects the updates least recently accessed (and then least
 * recently published) to delete. Ignores filters and scopes.
 */
class ReaperSelectionPolicyDevelopmentClient @JvmOverloads constructor(private val maxUpdatesToKeep: Int = DEFAULT_MAX_UPDATES_TO_KEEP) :
  ReaperSelectionPolicy {
  override fun selectUpdatesToDelete(
    updates: List<UpdateEntity>,
    launchedUpdate: UpdateEntity?,
    filters: JSONObject?
  ): List<UpdateEntity> {
    if (launchedUpdate == null || updates.size <= maxUpdatesToKeep) {
      return ArrayList()
    }
    val updatesMutable = updates.toMutableList()
    updatesMutable.sortWith { u1: UpdateEntity, u2: UpdateEntity ->
      var compare = u1.lastAccessed.compareTo(u2.lastAccessed)
      if (compare == 0) {
        compare = u1.commitTime.compareTo(u2.commitTime)
      }
      compare
    }
    val updatesToDelete = mutableListOf<UpdateEntity>()
    var hasFoundLaunchedUpdate = false
    while (updatesMutable.size > maxUpdatesToKeep) {
      val oldest = updatesMutable.removeAt(0)
      if (oldest.id == launchedUpdate.id) {
        if (hasFoundLaunchedUpdate) {
          // avoid infinite loop
          throw AssertionError("Multiple updates with the same ID were passed into ReaperSelectionPolicyDevelopmentClient")
        }
        // we don't want to delete launchedUpdate, so put it back on the end of the stack
        updatesMutable.add(oldest)
        hasFoundLaunchedUpdate = true
      } else {
        updatesToDelete.add(oldest)
      }
    }
    return updatesToDelete
  }

  init {
    if (maxUpdatesToKeep <= 0) {
      throw AssertionError("Cannot initialize ReaperSelectionPolicyDevelopmentClient with maxUpdatesToKeep <= 0")
    }
  }
}
