package expo.modules.updates.manifest;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

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

  public static Manifest getManifest(Context context, JSONObject manifestJson) throws JSONException {
    if (isLegacy(context)) {
      return LegacyManifest.fromLegacyManifestJson(manifestJson);
    } else {
      return NewManifest.fromManifestJson(manifestJson);
    }
  }

  public static Manifest getEmbeddedManifest(Context context, JSONObject manifestJson) throws JSONException {
    if (isLegacy(context)) {
      if (manifestJson.has("releaseId")) {
        return LegacyManifest.fromLegacyManifestJson(manifestJson);
      } else {
        return BareManifest.fromManifestJson(manifestJson);
      }
    } else {
      if (manifestJson.has("runtimeVersion")) {
        return NewManifest.fromManifestJson(manifestJson);
      } else {
        return BareManifest.fromManifestJson(manifestJson);
      }
    }
  }
}
