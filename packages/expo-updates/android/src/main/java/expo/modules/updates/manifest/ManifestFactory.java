package expo.modules.updates.manifest;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import expo.modules.updates.UpdatesConfiguration;

public class ManifestFactory {

  private static final String TAG = ManifestFactory.class.getSimpleName();

  private static Boolean sIsLegacy = null;

  private static boolean isLegacy(Context context) {
    if (sIsLegacy == null) {
      try {
        ApplicationInfo ai = context.getPackageManager().getApplicationInfo(context.getPackageName(), PackageManager.GET_META_DATA);
        sIsLegacy = ai.metaData.getBoolean("expo.modules.updates.EXPO_LEGACY_MANIFEST", true);
      } catch (Exception e) {
        Log.e(TAG, "Failed to read expo.modules.updates.EXPO_LEGACY_MANIFEST meta-data from AndroidManifest", e);
      }
    }
    return sIsLegacy;
  }

  public static Manifest getManifest(JSONObject manifestJson, UpdatesConfiguration configuration, Context context) throws JSONException {
    if (isLegacy(context)) {
      return LegacyManifest.fromLegacyManifestJson(manifestJson, configuration);
    } else {
      return NewManifest.fromManifestJson(manifestJson, configuration);
    }
  }

  public static Manifest getEmbeddedManifest(JSONObject manifestJson, UpdatesConfiguration configuration, Context context) throws JSONException {
    if (isLegacy(context)) {
      if (manifestJson.has("releaseId")) {
        return LegacyManifest.fromLegacyManifestJson(manifestJson, configuration);
      } else {
        return BareManifest.fromManifestJson(manifestJson, configuration);
      }
    } else {
      if (manifestJson.has("runtimeVersion")) {
        return NewManifest.fromManifestJson(manifestJson, configuration);
      } else {
        return BareManifest.fromManifestJson(manifestJson, configuration);
      }
    }
  }
}
