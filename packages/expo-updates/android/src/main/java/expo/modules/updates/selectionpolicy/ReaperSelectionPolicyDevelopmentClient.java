package expo.modules.updates.selectionpolicy;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import expo.modules.updates.db.entity.UpdateEntity;

/**
 * ReaperSelectionPolicy which keeps a predefined maximum number of updates across all scopes, and,
 * once that number is surpassed, selects the updates least recently accessed (and then least
 * recently published) to delete. Ignores filters and scopes.
 */
public class ReaperSelectionPolicyDevelopmentClient implements ReaperSelectionPolicy {

  private static final int DEFAULT_MAX_UPDATES_TO_KEEP = 10;

  private int mMaxUpdatesToKeep;

  public ReaperSelectionPolicyDevelopmentClient() {
    this(DEFAULT_MAX_UPDATES_TO_KEEP);
  }

  public ReaperSelectionPolicyDevelopmentClient(int maxUpdatesToKeep) {
    if (maxUpdatesToKeep <= 0) {
      throw new AssertionError("Cannot initialize ReaperSelectionPolicyDevelopmentClient with maxUpdatesToKeep <= 0");
    }
    mMaxUpdatesToKeep = maxUpdatesToKeep;
  }

  @Override
  public List<UpdateEntity> selectUpdatesToDelete(List<UpdateEntity> updates, UpdateEntity launchedUpdate, JSONObject filters) {
    if (launchedUpdate == null || updates.size() <= mMaxUpdatesToKeep) {
      return new ArrayList<>();
    }

    List<UpdateEntity> updatesMutable = new ArrayList<>(updates);
    Collections.sort(updatesMutable, (u1, u2) -> {
      int compare = u1.lastAccessed.compareTo(u2.lastAccessed);
      if (compare == 0) {
        compare = u1.commitTime.compareTo(u2.commitTime);
      }
      return compare;
    });

    List<UpdateEntity> updatesToDelete = new ArrayList<>();
    boolean hasFoundLaunchedUpdate = false;
    while (updatesMutable.size() > mMaxUpdatesToKeep) {
      UpdateEntity oldest = updatesMutable.remove(0);
      if (oldest.id.equals(launchedUpdate.id)) {
        if (hasFoundLaunchedUpdate) {
          // avoid infinite loop
          throw new AssertionError("Multiple updates with the same ID were passed into ReaperSelectionPolicyDevelopmentClient");
        }
        // we don't want to delete launchedUpdate, so put it back on the end of the stack
        updatesMutable.add(oldest);
        hasFoundLaunchedUpdate = true;
      } else {
        updatesToDelete.add(oldest);
      }
    }

    return updatesToDelete;
  }
}
