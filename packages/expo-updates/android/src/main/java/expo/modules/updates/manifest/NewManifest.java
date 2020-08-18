package expo.modules.updates.manifest;

import android.net.Uri;
import android.util.Log;

import expo.modules.updates.UpdatesConfiguration;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Date;
import java.util.UUID;

import static expo.modules.updates.loader.EmbeddedLoader.BUNDLE_FILENAME;

public class NewManifest implements Manifest {

  private static String TAG = Manifest.class.getSimpleName();

  private UUID mId;
  private String mScopeKey;
  private Date mCommitTime;
  private String mRuntimeVersion;
  private JSONObject mMetadata;
  private Uri mBundleUrl;
  private JSONArray mAssets;

  private JSONObject mManifestJson;

  private NewManifest(JSONObject manifestJson,
                      UUID id,
                      String scopeKey,
                      Date commitTime,
                      String runtimeVersion,
                      JSONObject metadata,
                      Uri bundleUrl,
                      JSONArray assets) {
    mManifestJson = manifestJson;
    mId = id;
    mScopeKey = scopeKey;
    mCommitTime = commitTime;
    mRuntimeVersion = runtimeVersion;
    mMetadata = metadata;
    mBundleUrl = bundleUrl;
    mAssets = assets;
  }

  public static NewManifest fromManifestJson(JSONObject manifestJson, UpdatesConfiguration configuration) throws JSONException {
    UUID id = UUID.fromString(manifestJson.getString("id"));
    Date commitTime = new Date(manifestJson.getLong("commitTime"));
    String runtimeVersion = manifestJson.getString("runtimeVersion");
    JSONObject metadata = manifestJson.optJSONObject("metadata");
    Uri bundleUrl = Uri.parse(manifestJson.getString("bundleUrl"));
    JSONArray assets = manifestJson.optJSONArray("assets");

    return new NewManifest(manifestJson, id, configuration.getScopeKey(), commitTime, runtimeVersion, metadata, bundleUrl, assets);
  }

  public JSONObject getRawManifestJson() {
    return mManifestJson;
  }

  public UpdateEntity getUpdateEntity() {
    UpdateEntity updateEntity = new UpdateEntity(mId, mCommitTime, mRuntimeVersion, mScopeKey);
    if (mMetadata != null) {
      updateEntity.metadata = mMetadata;
    }

    return updateEntity;
  }

  public ArrayList<AssetEntity> getAssetEntityList() {
    ArrayList<AssetEntity> assetList = new ArrayList<>();

    AssetEntity bundleAssetEntity = new AssetEntity("bundle-" + mCommitTime.getTime(), "js");
    bundleAssetEntity.url = mBundleUrl;
    bundleAssetEntity.isLaunchAsset = true;
    bundleAssetEntity.embeddedAssetFilename = BUNDLE_FILENAME;
    assetList.add(bundleAssetEntity);

    if (mAssets != null && mAssets.length() > 0) {
      for (int i = 0; i < mAssets.length(); i++) {
        try {
          JSONObject assetObject = mAssets.getJSONObject(i);
          AssetEntity assetEntity = new AssetEntity(
            assetObject.getString("key"),
            assetObject.getString("type")
          );
          assetEntity.url = Uri.parse(assetObject.getString("url"));
          assetEntity.embeddedAssetFilename = assetObject.optString("embeddedAssetFilename");
          assetList.add(assetEntity);
        } catch (JSONException e) {
          Log.e(TAG, "Could not read asset from manifest", e);
        }
      }
    }

    return assetList;
  }

  public boolean isDevelopmentMode() {
    return false;
  }
}
