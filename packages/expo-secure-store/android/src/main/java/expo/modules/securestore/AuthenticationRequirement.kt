package expo.modules.securestore

import expo.modules.kotlin.types.Either
import org.json.JSONObject

internal const val AUTHENTICATION_METHOD_NONE = "none"
internal const val AUTHENTICATION_METHOD_BIOMETRY = "biometry"
internal const val AUTHENTICATION_METHOD_DEVICE_CREDENTIALS = "deviceCredentials"

internal fun normalizeAuthenticationRequirement(value: Any?): String? {
  return when (value) {
    null, JSONObject.NULL, false, AUTHENTICATION_METHOD_NONE -> null
    true, AUTHENTICATION_METHOD_BIOMETRY -> AUTHENTICATION_METHOD_BIOMETRY
    AUTHENTICATION_METHOD_DEVICE_CREDENTIALS -> AUTHENTICATION_METHOD_DEVICE_CREDENTIALS
    else -> throw InvalidAuthenticationOptionException(value.toString())
  }
}

internal fun normalizeAuthenticationRequirement(value: Either<Boolean, String>?): String? {
  val rawValue: Any? = value?.let {
    if (it.`is`(Boolean::class)) {
      it.get(Boolean::class)
    } else {
      it.get(String::class)
    }
  }
  return normalizeAuthenticationRequirement(rawValue)
}
