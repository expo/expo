package expo.modules.updates.manifest;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

public class ManifestFactory {

  private static final String TAG = ManifestFactory.class.getSimpleName();

  public static Manifest getManifest(Context context, JSONObject manifestJson) throws JSONException {
    boolean isLegacy = true;
    try {
      ApplicationInfo ai = context.getPackageManager().getApplicationInfo(context.getPackageName(), PackageManager.GET_META_DATA);
      isLegacy = ai.metaData.getBoolean("expo.modules.updates.EXPO_LEGACY_MANIFEST", true);
    } catch (Exception e) {
      Log.e(TAG, "Failed to read expo.modules.updates.EXPO_LEGACY_MANIFEST meta-data from AndroidManifest", e);
    }
    if (isLegacy) {
      return LegacyManifest.fromLegacyManifestJson(manifestJson);
    } else {
      return NewManifest.fromManifestJson(manifestJson);
    }
  }
}
