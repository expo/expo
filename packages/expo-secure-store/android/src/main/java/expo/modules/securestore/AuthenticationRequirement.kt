package expo.modules.securestore

import org.json.JSONObject

internal const val AUTHENTICATION_METHOD_BIOMETRY = "biometry"
internal const val AUTHENTICATION_METHOD_DEVICE_CREDENTIALS = "deviceCredentials"

internal fun normalizeAuthenticationRequirement(value: Any?): String? {
  return when (value) {
    null, JSONObject.NULL, false -> null
    true, AUTHENTICATION_METHOD_BIOMETRY -> AUTHENTICATION_METHOD_BIOMETRY
    AUTHENTICATION_METHOD_DEVICE_CREDENTIALS -> AUTHENTICATION_METHOD_DEVICE_CREDENTIALS
    else -> throw InvalidAuthenticationOptionException(value.toString())
  }
}
