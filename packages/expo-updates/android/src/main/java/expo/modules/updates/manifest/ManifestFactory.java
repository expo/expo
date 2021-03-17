package expo.modules.updates.manifest;

import org.json.JSONException;
import org.json.JSONObject;

import expo.modules.updates.UpdatesConfiguration;

public class ManifestFactory {

  private static final String TAG = ManifestFactory.class.getSimpleName();

  public static Manifest getManifest(JSONObject manifestJson, ManifestResponse httpResponse, UpdatesConfiguration configuration) throws Exception {
    String expoProtocolVersion = httpResponse.header("expo-protocol-version", null);

    if (expoProtocolVersion == null) {
      return LegacyManifest.fromLegacyManifestJson(manifestJson, configuration);
    } else if (Integer.valueOf(expoProtocolVersion) == 0) {
      return NewManifest.fromManifestJson(manifestJson, httpResponse, configuration);
    } else {
      throw new Exception("Unsupported expo-protocol-version: " + expoProtocolVersion);
    }
  }

  public static Manifest getEmbeddedManifest(JSONObject manifestJson, UpdatesConfiguration configuration) throws JSONException {
    if (manifestJson.has("releaseId")) {
      return LegacyManifest.fromLegacyManifestJson(manifestJson, configuration);
    } else {
      return BareManifest.fromManifestJson(manifestJson, configuration);
    }
  }
}
