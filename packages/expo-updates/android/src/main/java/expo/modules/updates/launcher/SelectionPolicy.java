package expo.modules.updates.launcher;

import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.manifest.Manifest;

import java.util.List;

public interface SelectionPolicy {
  UpdateEntity selectUpdateToLaunch(List<UpdateEntity> updates);
  List<UpdateEntity> selectUpdatesToDelete(List<UpdateEntity> updates, UpdateEntity launchedUpdate);
  boolean shouldLoadNewUpdate(UpdateEntity newUpdate, UpdateEntity launchedUpdate);
  boolean shouldLoadNewUpdate(Manifest newManifest, UpdateEntity launchedUpdate);
}
