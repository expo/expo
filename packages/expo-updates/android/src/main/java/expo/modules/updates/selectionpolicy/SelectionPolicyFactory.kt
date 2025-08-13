package expo.modules.updates.selectionpolicy

import expo.modules.updates.UpdatesConfiguration

/**
 * Factory class to ease the construction of [SelectionPolicy] objects whose three methods all use
 * the same ordering policy.
 */
object SelectionPolicyFactory {
  @JvmStatic fun createFilterAwarePolicy(runtimeVersion: String, config: UpdatesConfiguration): SelectionPolicy {
    return SelectionPolicy(
      LauncherSelectionPolicyFilterAware(runtimeVersion, config),
      LoaderSelectionPolicyFilterAware(config),
      ReaperSelectionPolicyFilterAware()
    )
  }
}
