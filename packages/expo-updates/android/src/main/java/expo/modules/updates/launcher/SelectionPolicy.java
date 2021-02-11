package expo.modules.updates.launcher;

import org.json.JSONObject;

import expo.modules.updates.db.entity.UpdateEntity;

import java.util.List;

public interface SelectionPolicy {
  UpdateEntity selectUpdateToLaunch(List<UpdateEntity> updates, JSONObject filters);
  List<UpdateEntity> selectUpdatesToDelete(List<UpdateEntity> updates, UpdateEntity launchedUpdate, JSONObject filters);
  boolean shouldLoadNewUpdate(UpdateEntity newUpdate, UpdateEntity launchedUpdate, JSONObject filters);
}
