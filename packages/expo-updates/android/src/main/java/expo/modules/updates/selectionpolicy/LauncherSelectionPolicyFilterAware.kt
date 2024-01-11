package expo.modules.updates.selectionpolicy

import expo.modules.updates.db.entity.UpdateEntity
import org.json.JSONObject

/**
 * LauncherSelectionPolicy which chooses an update to launch based on the manifest filters
 * provided by the server. If multiple updates meet the criteria, the newest one (using `commitTime`
 * for ordering) is chosen, but the manifest filters are always taken into account before the
 * `commitTime`.
 */
class LauncherSelectionPolicyFilterAware(private val runtimeVersion: String) : LauncherSelectionPolicy {

  override fun selectUpdateToLaunch(
    updates: List<UpdateEntity>,
    filters: JSONObject?
  ): UpdateEntity? {
    var updateToLaunch: UpdateEntity? = null
    for (update in updates) {
      if (runtimeVersion != update.runtimeVersion || !SelectionPolicies.matchesFilters(update, filters)) {
        continue
      }
      if (updateToLaunch == null || updateToLaunch.commitTime.before(update.commitTime)) {
        updateToLaunch = update
      }
    }
    return updateToLaunch
  }
}
