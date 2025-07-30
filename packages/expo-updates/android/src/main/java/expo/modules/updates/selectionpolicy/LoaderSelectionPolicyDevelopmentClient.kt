package expo.modules.updates.selectionpolicy

import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.loader.UpdateDirective
import org.json.JSONObject

/**
 * A policy like [LoaderSelectionPolicyFilterAware] for dev-client that allows nullable [UpdatesConfiguration]
 */
class LoaderSelectionPolicyDevelopmentClient(private val config: UpdatesConfiguration?) : LoaderSelectionPolicy {
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

    val hasUpdatesOverride = config?.hasUpdatesOverride ?: false
    if (hasUpdatesOverride) {
      return newUpdate.id != launchedUpdate.id &&
        newUpdate.url == config?.updateUrl &&
        newUpdate.requestHeaders == config?.requestHeaders
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
