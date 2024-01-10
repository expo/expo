package expo.modules.updates.manifest

import expo.modules.updates.UpdatesConfiguration
import expo.modules.manifests.core.EmbeddedManifest
import expo.modules.manifests.core.ExpoUpdatesManifest
import org.json.JSONException
import org.json.JSONObject

/**
 * Utility methods for parsing a JSON manifest using the correct [Update] implementation.
 */
object UpdateFactory {
  private val TAG = UpdateFactory::class.java.simpleName

  @Throws(Exception::class)
  fun getUpdate(manifestJson: JSONObject, responseHeaderData: ResponseHeaderData, extensions: JSONObject?, configuration: UpdatesConfiguration): Update {
    return when (val expoProtocolVersion = responseHeaderData.protocolVersion) {
      // TODO(wschurman): remove error in a few major releases after SDK 51 when it's unlikely classic updates
      // may erroneously be served
      null -> {
        throw Exception("Legacy manifests are no longer supported")
      }
      0, 1 -> {
        ExpoUpdatesUpdate.fromExpoUpdatesManifest(ExpoUpdatesManifest(manifestJson), extensions, configuration)
      }
      else -> {
        throw Exception("Unsupported expo-protocol-version: $expoProtocolVersion")
      }
    }
  }

  @Throws(JSONException::class)
  fun getEmbeddedUpdate(manifestJson: JSONObject, configuration: UpdatesConfiguration): EmbeddedUpdate {
    return EmbeddedUpdate.fromEmbeddedManifest(EmbeddedManifest(manifestJson), configuration)
  }
}
