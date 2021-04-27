package expo.modules.updates.selectionpolicy;

import java.util.List;

public class SelectionPolicyFactory {

  public static SelectionPolicy createFilterAwarePolicy(List<String> runtimeVersions) {
    return new SelectionPolicy(
            new LauncherSelectionPolicyFilterAware(runtimeVersions),
            new LoaderSelectionPolicyFilterAware(),
            new ReaperSelectionPolicyFilterAware()
    );
  }

  public static SelectionPolicy createFilterAwarePolicy(String runtimeVersion) {
    return new SelectionPolicy(
            new LauncherSelectionPolicyFilterAware(runtimeVersion),
            new LoaderSelectionPolicyFilterAware(),
            new ReaperSelectionPolicyFilterAware()
    );
  }
}
