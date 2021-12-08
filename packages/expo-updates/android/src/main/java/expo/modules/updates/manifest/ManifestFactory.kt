package expo.modules.updates.manifest

import expo.modules.updates.UpdatesConfiguration
import expo.modules.manifests.core.BareManifest
import expo.modules.manifests.core.LegacyManifest
import expo.modules.manifests.core.NewManifest
import okhttp3.Headers
import org.json.JSONException
import org.json.JSONObject

object ManifestFactory {
  private val TAG = ManifestFactory::class.java.simpleName

  @Throws(Exception::class)
  fun getManifest(manifestJson: JSONObject, responseHeaders: Headers, extensions: JSONObject?, configuration: UpdatesConfiguration?): UpdateManifest {
    val expoProtocolVersion = responseHeaders["expo-protocol-version"]
    return when {
      expoProtocolVersion == null -> {
        LegacyUpdateManifest.fromLegacyManifest(LegacyManifest(manifestJson), configuration!!)
      }
      Integer.valueOf(expoProtocolVersion) == 0 -> {
        NewUpdateManifest.fromNewManifest(NewManifest(manifestJson), responseHeaders, extensions, configuration!!)
      }
      else -> {
        throw Exception("Unsupported expo-protocol-version: $expoProtocolVersion")
      }
    }
  }

  @Throws(JSONException::class)
  fun getEmbeddedManifest(manifestJson: JSONObject, configuration: UpdatesConfiguration?): UpdateManifest {
    return if (manifestJson.has("releaseId")) {
      LegacyUpdateManifest.fromLegacyManifest(LegacyManifest(manifestJson), configuration!!)
    } else {
      BareUpdateManifest.fromBareManifest(BareManifest(manifestJson), configuration!!)
    }
  }
}
