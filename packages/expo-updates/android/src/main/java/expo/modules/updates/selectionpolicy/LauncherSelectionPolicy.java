package expo.modules.updates.selectionpolicy;

import org.json.JSONObject;

import java.util.List;

import expo.modules.updates.db.entity.UpdateEntity;

/**
 * Given a list of updates, implementations of this class should be able to choose one to launch.
 */
public interface LauncherSelectionPolicy {
  UpdateEntity selectUpdateToLaunch(List<UpdateEntity> updates, JSONObject filters);
}
