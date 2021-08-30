package expo.modules.updates.selectionpolicy;

import org.json.JSONObject;

import java.util.List;

import expo.modules.updates.db.entity.UpdateEntity;

/**
 * Given a list of updates, implementations of this class should choose which of those updates to
 * automatically delete from disk and which ones to keep.
 */
public interface ReaperSelectionPolicy {
  List<UpdateEntity> selectUpdatesToDelete(List<UpdateEntity> updates, UpdateEntity launchedUpdate, JSONObject filters);
}
