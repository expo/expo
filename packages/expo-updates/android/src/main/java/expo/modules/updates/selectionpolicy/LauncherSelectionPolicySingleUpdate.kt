package expo.modules.updates.selectionpolicy

import expo.modules.updates.db.entity.UpdateEntity
import org.json.JSONObject
import java.util.*

/**
 * Trivial LauncherSelectionPolicy that will choose a single predetermined update to launch.
 */
class LauncherSelectionPolicySingleUpdate(private val updateID: UUID) : LauncherSelectionPolicy {
  override fun selectUpdateToLaunch(
    updates: List<UpdateEntity>,
    filters: JSONObject?
  ): UpdateEntity? {
    return updates.find { it.id == updateID }
  }
}
