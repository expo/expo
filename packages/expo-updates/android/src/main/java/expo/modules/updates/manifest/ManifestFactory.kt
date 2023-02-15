package expo.modules.updates.manifest

import expo.modules.updates.UpdatesConfiguration
import expo.modules.manifests.core.BareManifest
import expo.modules.manifests.core.LegacyManifest
import expo.modules.manifests.core.NewManifest
import org.json.JSONException
import org.json.JSONObject

/**
 * Utility methods for parsing a JSON manifest using the correct [UpdateManifest] implementation.
 */
object ManifestFactory {
  private val TAG = ManifestFactory::class.java.simpleName

  @Throws(Exception::class)
  fun getManifest(manifestJson: JSONObject, manifestHeaderData: ManifestHeaderData, extensions: JSONObject?, configuration: UpdatesConfiguration?): UpdateManifest {
    val expoProtocolVersion = manifestHeaderData.protocolVersion
    return when {
      expoProtocolVersion == null -> {
        LegacyUpdateManifest.fromLegacyManifest(LegacyManifest(manifestJson), configuration!!)
      }
      Integer.valueOf(expoProtocolVersion) == 0 -> {
        NewUpdateManifest.fromNewManifest(NewManifest(manifestJson), manifestHeaderData, extensions, configuration!!)
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
