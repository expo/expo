package expo.modules.updates.selectionpolicy

/**
 * Factory class to ease the construction of [SelectionPolicy] objects whose three methods all use
 * the same ordering policy.
 */
object SelectionPolicyFactory {
  fun createFilterAwarePolicy(runtimeVersions: List<String>): SelectionPolicy {
    return SelectionPolicy(
      LauncherSelectionPolicyFilterAware(runtimeVersions),
      LoaderSelectionPolicyFilterAware(),
      ReaperSelectionPolicyFilterAware()
    )
  }

  @JvmStatic fun createFilterAwarePolicy(runtimeVersion: String): SelectionPolicy {
    return SelectionPolicy(
      LauncherSelectionPolicyFilterAware(runtimeVersion),
      LoaderSelectionPolicyFilterAware(),
      ReaperSelectionPolicyFilterAware()
    )
  }
}
