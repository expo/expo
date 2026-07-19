package expo.modules.updates.selectionpolicy

import expo.modules.updates.db.entity.UpdateEntity
import org.json.JSONObject

/**
 * Given a list of updates, implementations of this class should choose which of those updates to
 * automatically delete from disk and which ones to keep.
 */
interface ReaperSelectionPolicy {
  fun selectUpdatesToDelete(
    updates: List<UpdateEntity>,
    launchedUpdate: UpdateEntity?,
    filters: JSONObject?
  ): List<UpdateEntity>
}
