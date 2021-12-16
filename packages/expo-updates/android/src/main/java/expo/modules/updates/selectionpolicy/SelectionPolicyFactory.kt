package expo.modules.updates.selectionpolicy

object SelectionPolicyFactory {
  @JvmStatic fun createFilterAwarePolicy(runtimeVersion: String): SelectionPolicy {
    return SelectionPolicy(
      LauncherSelectionPolicyFilterAware(listOf(runtimeVersion)),
      LoaderSelectionPolicyFilterAware(),
      ReaperSelectionPolicyFilterAware()
    )
  }
}
