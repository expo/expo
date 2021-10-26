package expo.modules.updates.selectionpolicy;

import org.json.JSONObject;

import java.util.List;

import expo.modules.updates.UpdatesConfiguration;
import expo.modules.updates.db.entity.UpdateEntity;

public class SelectionPolicy {
  private LauncherSelectionPolicy mLauncherSelectionPolicy;
  private LoaderSelectionPolicy mLoaderSelectionPolicy;
  private ReaperSelectionPolicy mReaperSelectionPolicy;

  public SelectionPolicy(
          LauncherSelectionPolicy launcherSelectionPolicy,
          LoaderSelectionPolicy loaderSelectionPolicy,
          ReaperSelectionPolicy reaperSelectionPolicy) {
    mLauncherSelectionPolicy = launcherSelectionPolicy;
    mLoaderSelectionPolicy = loaderSelectionPolicy;
    mReaperSelectionPolicy = reaperSelectionPolicy;
  }

  public LauncherSelectionPolicy getLauncherSelectionPolicy() {
    return mLauncherSelectionPolicy;
  }

  public LoaderSelectionPolicy getLoaderSelectionPolicy() {
    return mLoaderSelectionPolicy;
  }

  public ReaperSelectionPolicy getReaperSelectionPolicy() {
    return mReaperSelectionPolicy;
  }

  public UpdateEntity selectUpdateToLaunch(List<UpdateEntity> updates, JSONObject filters, UpdatesConfiguration configuration) {
    return mLauncherSelectionPolicy.selectUpdateToLaunch(updates, filters, configuration);
  }

  public List<UpdateEntity> selectUpdatesToDelete(List<UpdateEntity> updates, UpdateEntity launchedUpdate, JSONObject filters, UpdatesConfiguration configuration) {
    return mReaperSelectionPolicy.selectUpdatesToDelete(updates, launchedUpdate, filters, configuration);
  }

  public boolean shouldLoadNewUpdate(UpdateEntity newUpdate, UpdateEntity launchedUpdate, JSONObject filters, UpdatesConfiguration configuration) {
    return mLoaderSelectionPolicy.shouldLoadNewUpdate(newUpdate, launchedUpdate, filters,configuration);
  }
}
