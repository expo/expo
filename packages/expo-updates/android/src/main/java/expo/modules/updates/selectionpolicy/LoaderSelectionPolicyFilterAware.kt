package expo.modules.updates.selectionpolicy

import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.loader.UpdateDirective
import org.json.JSONObject

/**
 * LoaderSelectionPolicy which decides whether or not to load an update or directive, taking filters into
 * account. Returns true (should load the update) if we don't have an existing newer update that
 * matches the given manifest filters.
 *
 * Uses `commitTime` to determine ordering of updates.
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

  override fun shouldLoadRollBackToEmbeddedDirective(
    directive: UpdateDirective.RollBackToEmbeddedUpdateDirective,
    embeddedUpdate: UpdateEntity,
    launchedUpdate: UpdateEntity?,
    filters: JSONObject?
  ): Boolean {
    // if the embedded update doesn't match the filters, don't roll back to it (changing the
    // timestamp of it won't change filter validity)
    if (!SelectionPolicies.matchesFilters(embeddedUpdate, filters)) {
      return false
    }

    if (launchedUpdate == null) {
      return true
    }

    // if the current update doesn't pass the manifest filters
    // we should roll back to the embedded update no matter the commitTime
    return if (!SelectionPolicies.matchesFilters(launchedUpdate, filters)) {
      true
    } else directive.commitTime.after(launchedUpdate.commitTime)
  }
}
