package expo.modules.updates.manifest

import expo.modules.updates.UpdatesConfiguration
import expo.modules.manifests.core.BareManifest
import expo.modules.manifests.core.NewManifest
import org.json.JSONException
import org.json.JSONObject

/**
 * Utility methods for parsing a JSON manifest using the correct [UpdateManifest] implementation.
 */
object ManifestFactory {
  private val TAG = ManifestFactory::class.java.simpleName

  @Throws(Exception::class)
  fun getManifest(manifestJson: JSONObject, responseHeaderData: ResponseHeaderData, extensions: JSONObject?, configuration: UpdatesConfiguration): UpdateManifest {
    return when (val expoProtocolVersion = responseHeaderData.protocolVersion) {
      // TODO(wschurman): remove error in a few major releases after SDK 51 when it's unlikely classic updates
      // may erroneously be served
      null -> {
        throw Exception("Legacy manifests are no longer supported")
      }
      0, 1 -> {
        NewUpdateManifest.fromNewManifest(NewManifest(manifestJson), extensions, configuration)
      }
      else -> {
        throw Exception("Unsupported expo-protocol-version: $expoProtocolVersion")
      }
    }
  }

  @Throws(JSONException::class)
  fun getEmbeddedManifest(manifestJson: JSONObject, configuration: UpdatesConfiguration): BareUpdateManifest {
    return BareUpdateManifest.fromBareManifest(BareManifest(manifestJson), configuration)
  }
}
