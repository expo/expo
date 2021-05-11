package expo.modules.updates.manifest

import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.manifest.raw.BareRawManifest
import expo.modules.updates.manifest.raw.LegacyRawManifest
import expo.modules.updates.manifest.raw.NewRawManifest
import expo.modules.updates.manifest.raw.RawManifest
import org.json.JSONException
import org.json.JSONObject

object ManifestFactory {
    private val TAG = ManifestFactory::class.java.simpleName

    @Throws(Exception::class)
    fun getManifest(manifestJson: JSONObject, httpResponse: ManifestResponse, configuration: UpdatesConfiguration?): Manifest {
        val expoProtocolVersion = httpResponse.header("expo-protocol-version", null)
        return when {
            expoProtocolVersion == null -> {
                LegacyManifest.fromLegacyRawManifest(LegacyRawManifest(manifestJson), configuration!!)
            }
            Integer.valueOf(expoProtocolVersion) == 0 -> {
                NewManifest.fromRawManifest(NewRawManifest(manifestJson), httpResponse, configuration!!)
            }
            else -> {
                throw Exception("Unsupported expo-protocol-version: $expoProtocolVersion")
            }
        }
    }

    @Throws(JSONException::class)
    fun getEmbeddedManifest(manifestJson: JSONObject, configuration: UpdatesConfiguration?): Manifest {
        return if (manifestJson.has("releaseId")) {
            LegacyManifest.fromLegacyRawManifest(LegacyRawManifest(manifestJson), configuration!!)
        } else {
            BareManifest.fromManifestJson(BareRawManifest(manifestJson), configuration!!)
        }
    }

    fun getRawManifestFromJson(manifestJson: JSONObject): RawManifest {
        return when {
            manifestJson.has("releaseId") -> {
                LegacyRawManifest(manifestJson)
            }
            manifestJson.has("metadata") -> {
                NewRawManifest(manifestJson)
            }
            else -> {
                BareRawManifest(manifestJson)
            }
        }
    }
}
