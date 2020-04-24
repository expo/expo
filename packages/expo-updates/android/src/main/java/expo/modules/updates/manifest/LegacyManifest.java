package expo.modules.updates.manifest;

import android.net.Uri;
import android.util.Log;

import expo.modules.updates.UpdatesController;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;
import java.util.UUID;

import static expo.modules.updates.loader.EmbeddedLoader.BUNDLE_FILENAME;

public class LegacyManifest implements Manifest {

  private static String TAG = Manifest.class.getSimpleName();

  private static String EXPO_ASSETS_URL_BASE = "https://d1wp6m56sqw74a.cloudfront.net/~assets/";
  private static String[] EXPO_DOMAINS = new String[] {"expo.io", "exp.host", "expo.test"};
  private Uri mAssetsUrlBase = null;

  private UUID mId;
  private Date mCommitTime;
  private String mRuntimeVersion;
  private JSONObject mMetadata;
  private Uri mBundleUrl;
  private JSONArray mAssets;

  private JSONObject mManifestJson;

  private LegacyManifest(JSONObject manifestJson, UUID id, Date commitTime, String runtimeVersion, JSONObject metadata, Uri bundleUrl, JSONArray assets) {
    mManifestJson = manifestJson;
    mId = id;
    mCommitTime = commitTime;
    mRuntimeVersion = runtimeVersion;
    mMetadata = metadata;
    mBundleUrl = bundleUrl;
    mAssets = assets;
  }

  public static LegacyManifest fromLegacyManifestJson(JSONObject manifestJson) throws JSONException {
    UUID id = UUID.fromString(manifestJson.getString("releaseId"));
    String commitTimeString = manifestJson.getString("commitTime");
    String runtimeVersion = manifestJson.getString("sdkVersion");
    JSONObject runtimeVersionObject = manifestJson.optJSONObject("runtimeVersion");
    if (runtimeVersionObject != null) {
      runtimeVersion = runtimeVersionObject.optString("android", runtimeVersion);
    }
    Uri bundleUrl = Uri.parse(manifestJson.getString("bundleUrl"));

    Date commitTime;
    try {
      DateFormat formatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
      formatter.setTimeZone(TimeZone.getTimeZone("GMT"));
      commitTime = formatter.parse(commitTimeString);
    } catch (ParseException e) {
      Log.e(TAG, "Could not parse commitTime", e);
      commitTime = new Date();
    }

    JSONArray bundledAssets = manifestJson.optJSONArray("bundledAssets");

    return new LegacyManifest(manifestJson, id, commitTime, runtimeVersion, manifestJson, bundleUrl, bundledAssets);
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
          String bundledAsset = mAssets.getString(i);
          int extensionIndex = bundledAsset.lastIndexOf('.');
          int prefixLength = "asset_".length();
          String hash = extensionIndex > 0
            ? bundledAsset.substring(prefixLength, extensionIndex)
            : bundledAsset.substring(prefixLength);
          String type = extensionIndex > 0 ? bundledAsset.substring(extensionIndex + 1) : "";

          AssetEntity assetEntity = new AssetEntity(hash + "." + type, type);
          assetEntity.url = Uri.withAppendedPath(getAssetsUrlBase(), hash);
          assetEntity.embeddedAssetFilename = bundledAsset;
          assetList.add(assetEntity);
        } catch (JSONException e) {
          Log.e(TAG, "Could not read asset from manifest", e);
        }
      }
    }

    return assetList;
  }

  private Uri getAssetsUrlBase() {
    if (mAssetsUrlBase == null) {
      Uri manifestUrl = UpdatesController.getInstance().getUpdateUrl();
      String hostname = manifestUrl.getHost();
      if (hostname == null) {
        mAssetsUrlBase = Uri.parse(EXPO_ASSETS_URL_BASE);
      } else {
        for (String expoDomain : EXPO_DOMAINS) {
          if (hostname.contains(expoDomain)) {
            mAssetsUrlBase = Uri.parse(EXPO_ASSETS_URL_BASE);
            break;
          }
        }

        if (mAssetsUrlBase == null) {
          // use manifest url as the base
          String assetsPath = getRawManifestJson().optString("assetUrlOverride", "assets");
          Uri.Builder assetsBaseUrlBuilder = manifestUrl.buildUpon();
          List<String> segments = manifestUrl.getPathSegments();
          assetsBaseUrlBuilder.path("");
          for (int i = 0; i < segments.size() - 1; i++) {
            assetsBaseUrlBuilder.appendPath(segments.get(i));
          }
          assetsBaseUrlBuilder.appendPath(assetsPath);
          mAssetsUrlBase = assetsBaseUrlBuilder.build();
        }
      }
    }
    return mAssetsUrlBase;
  }
}
