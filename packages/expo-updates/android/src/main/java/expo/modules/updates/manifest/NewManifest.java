package expo.modules.updates.manifest;

import android.net.Uri;
import android.util.Log;

import expo.modules.updates.UpdatesConfiguration;
import expo.modules.updates.UpdatesUtils;
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
  private JSONObject mLaunchAsset;
  private JSONArray mAssets;

  private JSONObject mManifestJson;

  private NewManifest(JSONObject manifestJson,
                      UUID id,
                      String scopeKey,
                      Date commitTime,
                      String runtimeVersion,
                      JSONObject launchAsset,
                      JSONArray assets) {
    mManifestJson = manifestJson;
    mId = id;
    mScopeKey = scopeKey;
    mCommitTime = commitTime;
    mRuntimeVersion = runtimeVersion;
    mLaunchAsset = launchAsset;
    mAssets = assets;
  }

  public static NewManifest fromManifestJson(JSONObject rootManifestJson, UpdatesConfiguration configuration) throws JSONException {
    JSONObject manifestJson = rootManifestJson;
    if (rootManifestJson.has("data")) {
      manifestJson = rootManifestJson.getJSONObject("data");
    }
    if (manifestJson.has("publicManifest")) {
      manifestJson = manifestJson.getJSONObject("publicManifest");
    }
    if (manifestJson.has("manifest")) {
      manifestJson = manifestJson.getJSONObject("manifest");
    }

    UUID id = UUID.fromString(manifestJson.getString("id"));
    String runtimeVersion = manifestJson.getString("runtimeVersion");
    JSONObject launchAsset = manifestJson.getJSONObject("launchAsset");
    JSONArray assets = manifestJson.optJSONArray("assets");

    Date commitTime;
    try {
      commitTime = UpdatesUtils.parseDateString(manifestJson.getString("createdAt"));
    } catch (Exception e) {
      Log.e(TAG, "Could not parse manifest createdAt string; falling back to current time", e);
      commitTime = new Date();
    }

    return new NewManifest(manifestJson, id, configuration.getScopeKey(), commitTime, runtimeVersion, launchAsset, assets);
  }

  public JSONObject getRawManifestJson() {
    return mManifestJson;
  }

  public UpdateEntity getUpdateEntity() {
    UpdateEntity updateEntity = new UpdateEntity(mId, mCommitTime, mRuntimeVersion, mScopeKey);
    updateEntity.metadata = mManifestJson;

    return updateEntity;
  }

  public ArrayList<AssetEntity> getAssetEntityList() {
    ArrayList<AssetEntity> assetList = new ArrayList<>();

    try {
      AssetEntity bundleAssetEntity = new AssetEntity("bundle-" + mCommitTime.getTime(), mLaunchAsset.getString("contentType"));
      bundleAssetEntity.url = Uri.parse(mLaunchAsset.getString("url"));
      bundleAssetEntity.isLaunchAsset = true;
      bundleAssetEntity.embeddedAssetFilename = BUNDLE_FILENAME;
      assetList.add(bundleAssetEntity);
    } catch (JSONException e) {
      Log.e(TAG, "Could not read launch asset from manifest", e);
    }

    if (mAssets != null && mAssets.length() > 0) {
      for (int i = 0; i < mAssets.length(); i++) {
        try {
          JSONObject assetObject = mAssets.getJSONObject(i);
          AssetEntity assetEntity = new AssetEntity(
            assetObject.getString("key"),
            assetObject.getString("contentType")
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
