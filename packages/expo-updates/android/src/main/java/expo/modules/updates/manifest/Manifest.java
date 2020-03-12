package expo.modules.updates.manifest;

import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;

import org.json.JSONObject;

import java.util.ArrayList;

public interface Manifest {
  UpdateEntity getUpdateEntity();
  ArrayList<AssetEntity> getAssetEntityList();
  JSONObject getRawManifestJson();
}
