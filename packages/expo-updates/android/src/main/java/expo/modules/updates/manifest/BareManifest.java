package expo.modules.updates.manifest;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Date;
import java.util.UUID;

import expo.modules.updates.UpdatesController;
import expo.modules.updates.UpdatesUtils;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.db.enums.UpdateStatus;

public class BareManifest implements Manifest {

  private static String TAG = BareManifest.class.getSimpleName();

  private UUID mId;
  private Date mCommitTime;
  private String mRuntimeVersion;
  private JSONObject mMetadata;

  private JSONObject mManifestJson;

  private BareManifest(JSONObject manifestJson, UUID id, Date commitTime, String runtimeVersion, JSONObject metadata) {
    mManifestJson = manifestJson;
    mId = id;
    mCommitTime = commitTime;
    mRuntimeVersion = runtimeVersion;
    mMetadata = metadata;
  }

  public static BareManifest fromManifestJson(JSONObject manifestJson) throws JSONException {
    UUID id = UUID.fromString(manifestJson.getString("id"));
    Date commitTime = new Date(manifestJson.getLong("commitTime"));
    String runtimeVersion = UpdatesUtils.getRuntimeVersion(UpdatesController.getInstance().getUpdatesConfiguration());
    JSONObject metadata = manifestJson.optJSONObject("metadata");

    return new BareManifest(manifestJson, id, commitTime, runtimeVersion, metadata);
  }

  public JSONObject getRawManifestJson() {
    return mManifestJson;
  }

  public UpdateEntity getUpdateEntity() {
    String projectIdentifier = UpdatesController.getInstance().getUpdateUrl().toString();
    UpdateEntity updateEntity = new UpdateEntity(mId, mCommitTime, mRuntimeVersion, projectIdentifier);
    if (mMetadata != null) {
      updateEntity.metadata = mMetadata;
    }
    updateEntity.status = UpdateStatus.EMBEDDED;

    return updateEntity;
  }

  public ArrayList<AssetEntity> getAssetEntityList() {
    // for now, don't copy any assets; this will be added in a later commit
    return new ArrayList<>();
  }
}
