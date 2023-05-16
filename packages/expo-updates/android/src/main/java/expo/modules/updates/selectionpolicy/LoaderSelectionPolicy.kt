package expo.modules.updates.selectionpolicy

import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.loader.UpdateDirective
import org.json.JSONObject

/**
 * Implementations of this class should be able to determine whether to load (either fetch remotely
 * or copy from an embedded location) a new update, given information about the one currently
 * running.
 */
interface LoaderSelectionPolicy {
  fun shouldLoadNewUpdate(
    newUpdate: UpdateEntity?,
    launchedUpdate: UpdateEntity?,
    filters: JSONObject?
  ): Boolean

  fun shouldLoadRollBackToEmbeddedDirective(
    directive: UpdateDirective.RollBackToEmbeddedUpdateDirective,
    embeddedUpdate: UpdateEntity,
    launchedUpdate: UpdateEntity?,
    filters: JSONObject?
  ): Boolean
}
