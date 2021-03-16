package expo.modules.updates.manifest;

import android.net.Uri;
import android.util.Log;

import androidx.annotation.Nullable;
import expo.modules.structuredheaders.BooleanItem;
import expo.modules.structuredheaders.Dictionary;
import expo.modules.structuredheaders.ListElement;
import expo.modules.structuredheaders.NumberItem;
import expo.modules.structuredheaders.Parser;
import expo.modules.structuredheaders.StringItem;
import expo.modules.updates.UpdatesConfiguration;
import expo.modules.updates.UpdatesUtils;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.ParseException;
import java.util.ArrayList;
import java.util.Date;
import java.util.Map;
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
  private String mServerDefinedHeaders;
  private String mManifestFilters;

  private NewManifest(JSONObject manifestJson,
                      UUID id,
                      String scopeKey,
                      Date commitTime,
                      String runtimeVersion,
                      JSONObject launchAsset,
                      JSONArray assets,
                      String serverDefinedHeaders,
                      String manifestFilters) {
    mManifestJson = manifestJson;
    mId = id;
    mScopeKey = scopeKey;
    mCommitTime = commitTime;
    mRuntimeVersion = runtimeVersion;
    mLaunchAsset = launchAsset;
    mAssets = assets;
    mServerDefinedHeaders = serverDefinedHeaders;
    mManifestFilters = manifestFilters;
  }

  public static NewManifest fromManifestJson(JSONObject rootManifestJson, ManifestResponse httpResponse, UpdatesConfiguration configuration) throws JSONException {
    JSONObject manifestJson = rootManifestJson;
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
    } catch (ParseException e) {
      Log.e(TAG, "Could not parse manifest createdAt string; falling back to current time", e);
      commitTime = new Date();
    }

    String serverDefinedHeaders = httpResponse != null ? httpResponse.header("expo-server-defined-headers") : null;
    String manifestFilters = httpResponse != null ? httpResponse.header("expo-manifest-filters") : null;

    return new NewManifest(manifestJson, id, configuration.getScopeKey(), commitTime, runtimeVersion, launchAsset, assets, serverDefinedHeaders, manifestFilters);
  }

  public @Nullable JSONObject getServerDefinedHeaders() {
    if (mServerDefinedHeaders == null) {
      return null;
    }
    return headerDictionaryToJSONObject(mServerDefinedHeaders);
  }

  public @Nullable JSONObject getManifestFilters() {
    if (mManifestFilters == null) {
      return null;
    }
    return headerDictionaryToJSONObject(mManifestFilters);
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
      AssetEntity bundleAssetEntity = new AssetEntity(mLaunchAsset.getString("key"), mLaunchAsset.getString("contentType"));
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

  /* package */ static @Nullable JSONObject headerDictionaryToJSONObject(String headerDictionary) {
    JSONObject jsonObject = new JSONObject();
    Parser parser = new Parser(headerDictionary);
    try {
      Dictionary filtersDictionary = parser.parseDictionary();
      Map<String, ListElement<? extends Object>> map = filtersDictionary.get();
      for (String key : map.keySet()) {
        ListElement<? extends Object> element = map.get(key);
        // ignore any dictionary entries whose type is not string, number, or boolean
        if (element instanceof StringItem || element instanceof BooleanItem || element instanceof NumberItem) {
          jsonObject.put(key, element.get());
        }
      }
    } catch (expo.modules.structuredheaders.ParseException | JSONException e) {
      Log.e(TAG, "Failed to parse manifest header content", e);
      return null;
    }
    return jsonObject;
  }
}
