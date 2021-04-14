package expo.modules.updates.selectionpolicy;

import org.json.JSONObject;

import java.util.List;
import java.util.UUID;

import expo.modules.updates.db.entity.UpdateEntity;

/**
 * Trivial LauncherSelectionPolicy that will choose a single predetermined update to launch.
 */
public class LauncherSelectionPolicySingleUpdate implements LauncherSelectionPolicy {

  private UUID mUpdateID;

  public LauncherSelectionPolicySingleUpdate(UUID updateID) {
    mUpdateID = updateID;
  }

  @Override
  public UpdateEntity selectUpdateToLaunch(List<UpdateEntity> updates, JSONObject filters) {
    for (UpdateEntity update : updates) {
      if (update.id.equals(mUpdateID)) {
        return update;
      }
    }
    return null;
  }
}
