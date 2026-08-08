package expo.modules.securestore

import org.json.JSONObject

internal const val AUTHENTICATION_METHOD_BIOMETRY = "biometry"
internal const val AUTHENTICATION_METHOD_DEVICE_CREDENTIALS = "deviceCredentials"

internal fun normalizeAuthenticationRequirement(value: Any?): String? {
  return when (value) {
    null, JSONObject.NULL -> null
    is Boolean -> if (value) AUTHENTICATION_METHOD_BIOMETRY else null
    is String -> when (value) {
      "", "false" -> null
      "true", AUTHENTICATION_METHOD_BIOMETRY -> AUTHENTICATION_METHOD_BIOMETRY
      AUTHENTICATION_METHOD_DEVICE_CREDENTIALS -> AUTHENTICATION_METHOD_DEVICE_CREDENTIALS
      else -> throw InvalidAuthenticationOptionException(value)
    }
    else -> throw InvalidAuthenticationOptionException(value.toString())
  }
}
