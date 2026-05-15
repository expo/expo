package expo.modules.observe

import android.util.Log
import expo.modules.interfaces.constants.ConstantsInterface
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive

@JvmInline
internal value class ExpoManifest(
  private val rawManifest: JsonObject
) {
  /**
   * Traverses the manifest using a dot-separated property chain.
   * For example, "extra.eas.projectId" will navigate rawManifest["extra"]["eas"]["projectId"].
   */
  private fun getProperty(propertyChain: String): JsonElement? {
    val keys = propertyChain.split(".")
    var current: JsonElement? = rawManifest
    for (key in keys) {
      current = (current as? JsonObject)?.get(key) ?: return null
    }
    return current
  }

  /**
   * Gets the project ID from the manifest.
   */
  val projectId: String?
    get() = getProperty("extra.eas.projectId")?.jsonPrimitive?.contentOrNull

  /**
   * Gets the extra.eas.observe.endpointUrl from the manifest.
   */
  val baseUrl: String?
    get() = getProperty("extra.eas.observe.endpointUrl")?.jsonPrimitive?.contentOrNull

  /**
   * Gets the extra.eas.observe.useOpenTelemetry from the manifest. Defaults to true.
   */
  val useOpenTelemetry: Boolean
    get() = getProperty("extra.eas.observe.useOpenTelemetry")?.jsonPrimitive?.booleanOrNull ?: true
}

internal fun getManifest(constants: ConstantsInterface?): ExpoManifest? {
  val constantsMap = constants?.constants
  val manifestString = constantsMap?.get("manifest") ?: run {
    Log.d(OBSERVE_TAG, "Manifest is null in ConstantsInterface")
    return null
  }
  val manifest = manifestString as? String ?: run {
    Log.d(OBSERVE_TAG, "Manifest value is not a String")
    return null
  }
  val rawManifest = runCatching {
    Json.parseToJsonElement(manifest) as? JsonObject
  }.onFailure { Log.d(OBSERVE_TAG, "Failed to parse manifest", it) }
    .getOrNull()

  return rawManifest?.let { ExpoManifest(it) }
}
