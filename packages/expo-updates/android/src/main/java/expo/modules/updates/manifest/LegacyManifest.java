package expo.modules.updates.manifest;

import android.net.Uri;
import android.util.Log;

import expo.modules.updates.UpdatesConfiguration;
import expo.modules.updates.UpdatesUtils;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.db.enums.UpdateStatus;

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
  private String mScopeKey;
  private Date mCommitTime;
  private String mRuntimeVersion;
  private JSONObject mMetadata;
  private Uri mBundleUrl;
  private JSONArray mAssets;

  private JSONObject mManifestJson;
  private Uri mManifestUrl;

  private LegacyManifest(JSONObject manifestJson,
                         Uri manifestUrl,
                         UUID id,
                         String scopeKey,
                         Date commitTime,
                         String runtimeVersion,
                         JSONObject metadata,
                         Uri bundleUrl,
                         JSONArray assets) {
    mManifestJson = manifestJson;
    mManifestUrl = manifestUrl;
    mId = id;
    mScopeKey = scopeKey;
    mCommitTime = commitTime;
    mRuntimeVersion = runtimeVersion;
    mMetadata = metadata;
    mBundleUrl = bundleUrl;
    mAssets = assets;
  }

  public static LegacyManifest fromLegacyManifestJson(JSONObject manifestJson, UpdatesConfiguration configuration) throws JSONException {
    UUID id;
    Date commitTime;
    if (isUsingDeveloperTool(manifestJson)) {
      // xdl doesn't always serve a releaseId, but we don't need one in dev mode
      id = UUID.randomUUID();
      commitTime = new Date();
    } else {
      id = UUID.fromString(manifestJson.getString("releaseId"));
      String commitTimeString = manifestJson.getString("commitTime");
      try {
        DateFormat formatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        formatter.setTimeZone(TimeZone.getTimeZone("GMT"));
        commitTime = formatter.parse(commitTimeString);
      } catch (ParseException e) {
        Log.e(TAG, "Could not parse commitTime", e);
        commitTime = new Date();
      }
    }

    String runtimeVersion = manifestJson.getString("sdkVersion");
    Object runtimeVersionObject = manifestJson.opt("runtimeVersion");
    if (runtimeVersionObject != null) {
      if (runtimeVersionObject instanceof String) {
        runtimeVersion = (String)runtimeVersionObject;
      } else if (runtimeVersionObject instanceof JSONObject) {
        runtimeVersion = ((JSONObject)runtimeVersionObject).optString("android", runtimeVersion);
      }
    }
    Uri bundleUrl = Uri.parse(manifestJson.getString("bundleUrl"));

    JSONArray bundledAssets = manifestJson.optJSONArray("bundledAssets");

    return new LegacyManifest(manifestJson,configuration.getUpdateUrl(), id, configuration.getScopeKey(), commitTime, runtimeVersion, manifestJson, bundleUrl, bundledAssets);
  }

  public JSONObject getRawManifestJson() {
    return mManifestJson;
  }

  public UpdateEntity getUpdateEntity() {
    UpdateEntity updateEntity = new UpdateEntity(mId, mCommitTime, mRuntimeVersion, mScopeKey);
    if (mMetadata != null) {
      updateEntity.metadata = mMetadata;
    }
    if (isDevelopmentMode()) {
      updateEntity.status = UpdateStatus.DEVELOPMENT;
    }

    return updateEntity;
  }

  public ArrayList<AssetEntity> getAssetEntityList() {
    ArrayList<AssetEntity> assetList = new ArrayList<>();

    String key;
    try {
      key = "bundle-" + UpdatesUtils.sha256(mBundleUrl.toString());
    } catch (Exception e) {
      key = "bundle-" + mCommitTime.getTime();
      Log.e(TAG, "Failed to get SHA-256 checksum of bundle URL");
    }
    AssetEntity bundleAssetEntity = new AssetEntity(key, "js");
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
      String hostname = mManifestUrl.getHost();
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
          Uri.Builder assetsBaseUrlBuilder = mManifestUrl.buildUpon();
          List<String> segments = mManifestUrl.getPathSegments();
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

  public boolean isDevelopmentMode() {
    return isDevelopmentMode(mManifestJson);
  }

  private static boolean isDevelopmentMode(final JSONObject manifest) {
    try {
      return (manifest != null &&
        manifest.has("developer") &&
        manifest.has("packagerOpts") &&
        manifest.getJSONObject("packagerOpts").optBoolean("dev", false));
    } catch (JSONException e) {
      return false;
    }
  }

  private static boolean isUsingDeveloperTool(final JSONObject manifest) {
    try {
      return (manifest != null &&
        manifest.has("developer") &&
        manifest.getJSONObject("developer").has("tool"));
    } catch (JSONException e) {
      return false;
    }
  }
}
