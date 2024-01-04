package host.exp.exponent

import expo.modules.manifests.core.Manifest
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.selectionpolicy.LauncherSelectionPolicy
import expo.modules.updates.selectionpolicy.SelectionPolicies
import org.json.JSONObject

/**
 * LauncherSelectionPolicy similar to LauncherSelectionPolicyFilterAware but specifically for
 * Expo Go which uses a Expo-Go-specific field to determine compatibility.
 */
class ExpoGoLauncherSelectionPolicyFilterAware(private val sdkVersions: List<String>) :
  LauncherSelectionPolicy {
  override fun selectUpdateToLaunch(
    updates: List<UpdateEntity>,
    filters: JSONObject?
  ): UpdateEntity? {
    var updateToLaunch: UpdateEntity? = null
    for (update in updates) {
      val manifest = Manifest.fromManifestJson(update.manifest)
      if (!sdkVersions.contains(manifest.getExpoGoSDKVersion()) || !SelectionPolicies.matchesFilters(
          update,
          filters
        )
      ) {
        continue
      }
      if (updateToLaunch == null || updateToLaunch.commitTime.before(update.commitTime)) {
        updateToLaunch = update
      }
    }
    return updateToLaunch
  }
}
