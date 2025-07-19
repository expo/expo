package expo.modules.updates.selectionpolicy

import expo.modules.updates.db.entity.UpdateEntity
import org.json.JSONObject

/**
 * A ReaperSelectionPolicy based on `ReaperSelectionPolicyFilterAware` that only removes override updates.
 */
internal class ReaperSelectionPolicyOverrideAware : ReaperSelectionPolicyFilterAware() {
  override fun selectUpdatesToDelete(
    updates: List<UpdateEntity>,
    launchedUpdate: UpdateEntity?,
    filters: JSONObject?
  ): List<UpdateEntity> {
    val overrideUpdates: List<UpdateEntity> = updates.filter { it.isFromOverride }
    return super.selectUpdatesToDelete(overrideUpdates, launchedUpdate, filters)
  }
}
