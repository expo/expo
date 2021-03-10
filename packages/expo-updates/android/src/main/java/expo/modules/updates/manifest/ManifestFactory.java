package expo.modules.updates.manifest;

import org.json.JSONException;
import org.json.JSONObject;

import expo.modules.updates.UpdatesConfiguration;

public class ManifestFactory {

  private static final String TAG = ManifestFactory.class.getSimpleName();

  public static Manifest getManifest(JSONObject manifestJson, ManifestResponse httpResponse, UpdatesConfiguration configuration) throws JSONException {
    if (configuration.usesLegacyManifest()) {
      return LegacyManifest.fromLegacyManifestJson(manifestJson, configuration);
    } else {
      return NewManifest.fromManifestJson(manifestJson, httpResponse, configuration);
    }
  }

  public static Manifest getEmbeddedManifest(JSONObject manifestJson, UpdatesConfiguration configuration) throws JSONException {
    if (configuration.usesLegacyManifest()) {
      if (manifestJson.has("releaseId")) {
        return LegacyManifest.fromLegacyManifestJson(manifestJson, configuration);
      } else {
        return BareManifest.fromManifestJson(manifestJson, configuration);
      }
    } else {
      // bare (embedded) manifests should never have a runtimeVersion field
      if (manifestJson.has("manifest") || manifestJson.has("runtimeVersion")) {
        return NewManifest.fromManifestJson(manifestJson, null, configuration);
      } else {
        return BareManifest.fromManifestJson(manifestJson, configuration);
      }
    }
  }
}
