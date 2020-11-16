package expo.modules.updates.manifest;

import android.util.Log;

import org.json.JSONObject;

import androidx.annotation.Nullable;
import expo.modules.updates.UpdatesConfiguration;
import expo.modules.updates.db.UpdatesDatabase;

public class ManifestServerData {

  private static final String TAG = ManifestServerData.class.getSimpleName();

  public static final String MANIFEST_SERVER_DEFINED_HEADERS_KEY = "serverDefinedHeaders";
  public static final String MANIFEST_FILTERS_KEY = "manifestFilters";

  private static @Nullable JSONObject getJSONObject(String key, UpdatesDatabase database, UpdatesConfiguration configuration) {
    try {
      String jsonString = database.jsonDataDao().loadJSONStringForKey(key, configuration.getScopeKey());
      return jsonString != null ? new JSONObject(jsonString) : null;
    } catch (Exception e) {
      Log.e(TAG, "Error retrieving " + key + " from database", e);
      return null;
    }
  }

  public static @Nullable JSONObject getServerDefinedHeaders(UpdatesDatabase database, UpdatesConfiguration configuration) {
    return getJSONObject(MANIFEST_SERVER_DEFINED_HEADERS_KEY, database, configuration);
  }

  public static @Nullable JSONObject getManifestFilters(UpdatesDatabase database, UpdatesConfiguration configuration) {
    return getJSONObject(MANIFEST_FILTERS_KEY, database, configuration);
  }

  public static void saveServerData(NewManifest manifest, UpdatesDatabase database, UpdatesConfiguration configuration) {
    if (manifest.getServerDefinedHeaders() != null) {
      database.jsonDataDao().setJSONStringForKey(
        MANIFEST_SERVER_DEFINED_HEADERS_KEY,
        manifest.getServerDefinedHeaders().toString(),
        configuration.getScopeKey());
    }
    if (manifest.getManifestFilters() != null) {
      database.jsonDataDao().setJSONStringForKey(
        MANIFEST_FILTERS_KEY,
        manifest.getManifestFilters().toString(),
        configuration.getScopeKey());
    }
  }
}
