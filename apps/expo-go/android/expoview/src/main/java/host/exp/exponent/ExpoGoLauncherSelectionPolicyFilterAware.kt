package host.exp.exponent

import expo.modules.manifests.core.Manifest
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.selectionpolicy.LauncherSelectionPolicy
import expo.modules.updates.selectionpolicy.SelectionPolicies
import org.json.JSONObject

/**
 * LauncherSelectionPolicy similar to LauncherSelectionPolicyFilterAware but specifically for
 * Expo Go which uses a Expo-Go-specific field to determine compatibility.
 *
 * Compatibility is determined by SDK major version (see [ABIVersion.isCompatibleSdkVersion]) so
 * that a client patch release whose version differs in its patch from the supported SDK version
 * (e.g. a 56.0.1 client serving SDK 56.0.0 updates) can still launch matching updates.
 */
class ExpoGoLauncherSelectionPolicyFilterAware(private val supportedSdkVersion: String) :
  LauncherSelectionPolicy {
  override fun selectUpdateToLaunch(
    updates: List<UpdateEntity>,
    filters: JSONObject?
  ): UpdateEntity? {
    var updateToLaunch: UpdateEntity? = null
    for (update in updates) {
      val manifest = Manifest.fromManifestJson(update.manifest)
      if (!ABIVersion.isCompatibleSdkVersion(supportedSdkVersion, manifest.getExpoGoSDKVersion()) ||
        !SelectionPolicies.matchesFilters(update, filters)
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
