package expo.modules.updates.selectionpolicy

import expo.modules.updates.db.entity.UpdateEntity
import org.json.JSONObject

/**
 * A LauncherSelectionPolicy that prioritizes updates fetched with UpdatesConfigurationOverride.
 * This works similarly to LauncherSelectionPolicySingleUpdate but targets updates from override URLs
 * rather than a specific UUID.
 */
internal class LauncherSelectionPolicyOverrideAware : LauncherSelectionPolicy {
  override fun selectUpdateToLaunch(
    updates: List<UpdateEntity>,
    filters: JSONObject?
  ): UpdateEntity? {
    val candidates = updates
      .filter { SelectionPolicies.matchesFilters(it, filters) }
      .sortedByDescending { it.commitTime }

    val firstOverrideUpdate: UpdateEntity? = candidates.firstOrNull { it.isFromOverride }

    // If no override updates there, we just try first update anyway.
    return firstOverrideUpdate ?: candidates.firstOrNull()
  }
}
