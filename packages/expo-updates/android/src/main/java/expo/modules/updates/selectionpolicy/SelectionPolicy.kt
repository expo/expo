package expo.modules.updates.selectionpolicy

import expo.modules.updates.db.entity.UpdateEntity
import org.json.JSONObject

class SelectionPolicy(
  val launcherSelectionPolicy: LauncherSelectionPolicy,
  val loaderSelectionPolicy: LoaderSelectionPolicy,
  val reaperSelectionPolicy: ReaperSelectionPolicy
) {
  fun selectUpdateToLaunch(updates: List<UpdateEntity>, filters: JSONObject?): UpdateEntity? {
    return launcherSelectionPolicy.selectUpdateToLaunch(updates, filters)
  }

  fun selectUpdatesToDelete(
    updates: List<UpdateEntity>,
    launchedUpdate: UpdateEntity,
    filters: JSONObject?
  ): List<UpdateEntity> {
    return reaperSelectionPolicy.selectUpdatesToDelete(updates, launchedUpdate, filters)
  }

  fun shouldLoadNewUpdate(
    newUpdate: UpdateEntity?,
    launchedUpdate: UpdateEntity?,
    filters: JSONObject?
  ): Boolean {
    return loaderSelectionPolicy.shouldLoadNewUpdate(newUpdate, launchedUpdate, filters)
  }
}
