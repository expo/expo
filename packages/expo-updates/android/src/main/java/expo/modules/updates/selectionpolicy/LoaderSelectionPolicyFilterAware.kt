package expo.modules.updates.selectionpolicy

import expo.modules.updates.UpdatesConfiguration
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
class LoaderSelectionPolicyFilterAware(private val config: UpdatesConfiguration) : LoaderSelectionPolicy {
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
    if (!SelectionPolicies.matchesFilters(launchedUpdate, filters)) {
      return true
    }

    // if new update doesn't match the configured URL, don't load it
    if (newUpdate.url != null && newUpdate.url != config.updateUrl) {
      return false
    }

    // if new update doesn't match the configured request headers, don't load it
    if (newUpdate.requestHeaders != null && newUpdate.requestHeaders != config.requestHeaders) {
      return false
    }

    // if the launched update no longer matches the configured URL, we should load the new update
    if (launchedUpdate.url != null && launchedUpdate.url != config.updateUrl) {
      return true
    }

    // if the launched update no longer matches the configured request headers, we should load the new update
    if (launchedUpdate.requestHeaders != null && launchedUpdate.requestHeaders != config.requestHeaders) {
      return true
    }

    return newUpdate.commitTime.after(launchedUpdate.commitTime)
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
    } else {
      directive.commitTime.after(launchedUpdate.commitTime)
    }
  }
}
