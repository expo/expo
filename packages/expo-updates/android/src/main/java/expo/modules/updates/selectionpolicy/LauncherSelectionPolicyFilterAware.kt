package expo.modules.updates.selectionpolicy

import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.entity.UpdateEntity
import org.json.JSONObject

/**
 * LauncherSelectionPolicy which chooses an update to launch based on the manifest filters
 * provided by the server. If multiple updates meet the criteria, the newest one (using `commitTime`
 * for ordering) is chosen, but the manifest filters are always taken into account before the
 * `commitTime`.
 */
class LauncherSelectionPolicyFilterAware(
  private val runtimeVersion: String,
  private val config: UpdatesConfiguration
) : LauncherSelectionPolicy {

  override fun selectUpdateToLaunch(
    updates: List<UpdateEntity>,
    filters: JSONObject?
  ): UpdateEntity? =
    updates
      .filter { runtimeVersion == it.runtimeVersion && SelectionPolicies.matchesFilters(it, filters) }
      .let { candidates ->
        if (config.hasUpdatesOverride) {
          // For overridden updates, filter out any with a null `update.url`.
          // This prevents launching the embedded update; launch the remote overridden update instead.
          candidates.filter {
            it.url == config.updateUrl && it.requestHeaders == config.requestHeaders
          }
        } else {
          candidates
        }
      }
      .maxByOrNull { it.commitTime }
}
