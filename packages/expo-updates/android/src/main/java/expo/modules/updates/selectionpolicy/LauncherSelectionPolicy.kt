package expo.modules.updates.selectionpolicy

import expo.modules.updates.db.entity.UpdateEntity
import org.json.JSONObject

/**
 * Given a list of updates, implementations of this class should be able to choose one to launch.
 */
interface LauncherSelectionPolicy {
  fun selectUpdateToLaunch(updates: List<UpdateEntity>, filters: JSONObject?): UpdateEntity?
}
