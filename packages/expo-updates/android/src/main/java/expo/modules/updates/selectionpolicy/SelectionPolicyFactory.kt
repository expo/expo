package expo.modules.updates.selectionpolicy

object SelectionPolicyFactory {
  fun createFilterAwarePolicy(runtimeVersions: List<String>): SelectionPolicy {
    return SelectionPolicy(
      LauncherSelectionPolicyFilterAware(runtimeVersions),
      LoaderSelectionPolicyFilterAware(),
      ReaperSelectionPolicyFilterAware()
    )
  }

  fun createFilterAwarePolicy(runtimeVersion: String): SelectionPolicy {
    return SelectionPolicy(
      LauncherSelectionPolicyFilterAware(runtimeVersion),
      LoaderSelectionPolicyFilterAware(),
      ReaperSelectionPolicyFilterAware()
    )
  }
}
