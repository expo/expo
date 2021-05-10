package expo.modules.updates.selectionpolicy;

import org.json.JSONObject;

import expo.modules.updates.db.entity.UpdateEntity;

/**
 * LoaderSelectionPolicy which decides whether or not to load an update, taking filters into
 * account. Returns true (should load the update) if we don't have an existing newer update that
 * matches the given manifest filters.
 */
public class LoaderSelectionPolicyFilterAware implements LoaderSelectionPolicy {

  @Override
  public boolean shouldLoadNewUpdate(UpdateEntity newUpdate, UpdateEntity launchedUpdate, JSONObject filters) {
    if (newUpdate == null) {
      return false;
    }
    // if the new update doesn't pass its own manifest filters, we shouldn't load it
    if (!SelectionPolicies.matchesFilters(newUpdate, filters)) {
      return false;
    }

    if (launchedUpdate == null) {
      return true;
    }
    // if the current update doesn't pass the manifest filters
    // we should load the new update no matter the commitTime
    if (!SelectionPolicies.matchesFilters(launchedUpdate, filters)) {
      return true;
    }
    return newUpdate.commitTime.after(launchedUpdate.commitTime);
  }
}
