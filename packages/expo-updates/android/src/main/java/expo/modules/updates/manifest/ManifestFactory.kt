package expo.modules.updates.manifest

import expo.modules.updates.UpdatesConfiguration
import org.json.JSONException
import org.json.JSONObject

object ManifestFactory {
    private val TAG = ManifestFactory::class.java.simpleName

    @Throws(Exception::class)
    fun getManifest(manifestJson: JSONObject?, httpResponse: ManifestResponse, configuration: UpdatesConfiguration?): Manifest {
        val expoProtocolVersion = httpResponse.header("expo-protocol-version", null)
        return when {
            expoProtocolVersion == null -> {
                LegacyManifest.fromLegacyManifestJson(manifestJson!!, configuration!!)
            }
            Integer.valueOf(expoProtocolVersion) == 0 -> {
                NewManifest.fromManifestJson(manifestJson!!, httpResponse, configuration!!)
            }
            else -> {
                throw Exception("Unsupported expo-protocol-version: $expoProtocolVersion")
            }
        }
    }

    @Throws(JSONException::class)
    fun getEmbeddedManifest(manifestJson: JSONObject, configuration: UpdatesConfiguration?): Manifest {
        return if (manifestJson.has("releaseId")) {
            LegacyManifest.fromLegacyManifestJson(manifestJson, configuration!!)
        } else {
            BareManifest.fromManifestJson(manifestJson, configuration!!)
        }
    }
}
