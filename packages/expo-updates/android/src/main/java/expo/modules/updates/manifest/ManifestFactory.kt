package expo.modules.updates.manifest

import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.manifest.raw.BareRawManifest
import expo.modules.updates.manifest.raw.LegacyRawManifest
import expo.modules.updates.manifest.raw.NewRawManifest
import org.json.JSONException
import org.json.JSONObject

object ManifestFactory {
    private val TAG = ManifestFactory::class.java.simpleName

    @Throws(Exception::class)
    fun getManifest(manifestJson: JSONObject, httpResponse: ManifestResponse, configuration: UpdatesConfiguration?): Manifest {
        val expoProtocolVersion = httpResponse.header("expo-protocol-version", null)
        return when {
            expoProtocolVersion == null -> {
                LegacyManifest.fromLegacyRawManifest(manifestJson as LegacyRawManifest, configuration!!)
            }
            Integer.valueOf(expoProtocolVersion) == 0 -> {
                NewManifest.fromRawManifest(manifestJson as NewRawManifest, httpResponse, configuration!!)
            }
            else -> {
                throw Exception("Unsupported expo-protocol-version: $expoProtocolVersion")
            }
        }
    }

    @Throws(JSONException::class)
    fun getEmbeddedManifest(manifestJson: JSONObject, configuration: UpdatesConfiguration?): Manifest {
        return if (manifestJson.has("releaseId")) {
            LegacyManifest.fromLegacyRawManifest(manifestJson as LegacyRawManifest, configuration!!)
        } else {
            BareManifest.fromManifestJson(manifestJson as BareRawManifest, configuration!!)
        }
    }
}
