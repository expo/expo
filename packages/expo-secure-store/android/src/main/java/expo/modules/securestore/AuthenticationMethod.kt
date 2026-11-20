package expo.modules.securestore

import android.security.keystore.KeyProperties
import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_STRONG
import androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL
import expo.modules.kotlin.types.Enumerable
import org.json.JSONObject

enum class AuthenticationMethod(val value: String) : Enumerable {
  NONE("none"),
  BIOMETRY("biometry"),
  DEVICE_CREDENTIALS("deviceCredentials");

  val isAuthenticationRequired: Boolean
    get() = this != NONE

  val keystoreSuffix: String
    get() = when (this) {
      NONE -> SecureStoreModule.UNAUTHENTICATED_KEYSTORE_SUFFIX
      BIOMETRY -> SecureStoreModule.AUTHENTICATED_KEYSTORE_SUFFIX
      DEVICE_CREDENTIALS -> SecureStoreModule.DEVICE_CREDENTIALS_KEYSTORE_SUFFIX
    }

  // Older versions read this field with optBoolean, so the modes they know keep the boolean format.
  val storedValue: Any
    get() = when (this) {
      NONE -> false
      BIOMETRY -> true
      DEVICE_CREDENTIALS -> value
    }

  val keyAuthenticationType: Int
    get() = when (this) {
      DEVICE_CREDENTIALS -> KeyProperties.AUTH_BIOMETRIC_STRONG or KeyProperties.AUTH_DEVICE_CREDENTIAL
      else -> KeyProperties.AUTH_BIOMETRIC_STRONG
    }

  val promptAuthenticators: Int
    get() = when (this) {
      DEVICE_CREDENTIALS -> BIOMETRIC_STRONG or DEVICE_CREDENTIAL
      else -> BIOMETRIC_STRONG
    }

  companion object {
    fun fromStoredValue(value: Any?): AuthenticationMethod? = when (value) {
      null, JSONObject.NULL, false -> NONE
      true, BIOMETRY.value -> BIOMETRY
      DEVICE_CREDENTIALS.value -> DEVICE_CREDENTIALS
      else -> null
    }

    fun fromStoredItem(encryptedItem: JSONObject, key: String, keychainService: String): AuthenticationMethod =
      fromStoredValue(encryptedItem.opt(AuthenticationHelper.REQUIRE_AUTHENTICATION_PROPERTY))
        ?: throw DecryptException(
          "The entry has an unknown requireAuthentication value, probably written by a newer version of expo-secure-store. Delete the entry or save a new value under this key.",
          key,
          keychainService
        )
  }
}
