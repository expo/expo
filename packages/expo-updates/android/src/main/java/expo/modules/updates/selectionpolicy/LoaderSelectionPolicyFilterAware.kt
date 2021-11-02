package expo.modules.updates.selectionpolicy

import expo.modules.updates.db.entity.UpdateEntity
import org.json.JSONObject

/**
 * LoaderSelectionPolicy which decides whether or not to load an update, taking filters into
 * account. Returns true (should load the update) if we don't have an existing newer update that
 * matches the given manifest filters.
 */
class LoaderSelectionPolicyFilterAware : LoaderSelectionPolicy {
  override fun shouldLoadNewUpdate(
    newUpdate: UpdateEntity?,
    launchedUpdate: UpdateEntity?,
    filters: JSONObject?
  ): Boolean {
    if (newUpdate == null) {
      return false
    }
    // if the new update doesn't pass its own manifest filters, we shouldn't load it
    if (!SelectionPolicies.matchesFilters(newUpdate, filters)) {
      return false
    }
    if (launchedUpdate == null) {
      return true
    }
    // if the current update doesn't pass the manifest filters
    // we should load the new update no matter the commitTime
    return if (!SelectionPolicies.matchesFilters(launchedUpdate, filters)) {
      true
    } else newUpdate.commitTime.after(launchedUpdate.commitTime)
  }
}
