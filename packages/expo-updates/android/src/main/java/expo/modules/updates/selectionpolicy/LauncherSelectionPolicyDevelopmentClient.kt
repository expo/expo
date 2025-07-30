package expo.modules.updates.selectionpolicy

import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.entity.UpdateEntity
import org.json.JSONObject

/**
 * A policy like [LauncherSelectionPolicyFilterAware] for dev-client that allows nullable [UpdatesConfiguration]
 */
class LauncherSelectionPolicyDevelopmentClient(
  private val runtimeVersion: String,
  private val config: UpdatesConfiguration?
) : LauncherSelectionPolicy {

  override fun selectUpdateToLaunch(
    updates: List<UpdateEntity>,
    filters: JSONObject?
  ): UpdateEntity? =
    updates
      .filter { runtimeVersion == it.runtimeVersion && SelectionPolicies.matchesFilters(it, filters) }
      .let { candidates ->
        val hasUpdatesOverride = config?.hasUpdatesOverride ?: false
        if (hasUpdatesOverride) {
          candidates.filter {
            it.url == config?.updateUrl && it.requestHeaders == config?.requestHeaders
          }
        } else {
          candidates
        }
      }
      .maxByOrNull { it.commitTime }
}
