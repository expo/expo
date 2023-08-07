package expo.modules.securestore

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.os.Build
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.fragment.app.FragmentActivity
import expo.modules.core.ModuleRegistry
import expo.modules.core.interfaces.ActivityProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.crypto.Cipher

class AuthenticationHelper(
  private val context: Context,
  private val moduleRegistry: ModuleRegistry
) {
  private var isAuthenticating = false

  suspend fun authenticateCipher(cipher: Cipher, requiresAuthentication: Boolean, title: String): Cipher {
    if (requiresAuthentication) {
      return openAuthenticationPrompt(cipher, title).cryptoObject?.cipher
        ?: throw AuthenticationException("Couldn't get cipher from authentication result")
    }
    return cipher
  }

  private suspend fun openAuthenticationPrompt(
    cipher: Cipher,
    title: String
  ): BiometricPrompt.AuthenticationResult {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      throw AuthenticationException("Biometric authentication requires Android API 23")
    }
    if (isAuthenticating) {
      throw AuthenticationException("Authentication is already in progress")
    }

    isAuthenticating = true

    assertBiometricsSupport()
    val fragmentActivity = getCurrentActivity() as? FragmentActivity
      ?: throw AuthenticationException("Cannot display biometric prompt when the app is not in the foreground")

    val authenticationPrompt = AuthenticationPrompt(fragmentActivity, context, title)

    return withContext(Dispatchers.Main.immediate) {
      try {
        return@withContext authenticationPrompt.authenticate(cipher)
          ?: throw AuthenticationException("Couldn't get the authentication result")
      } finally {
        isAuthenticating = false
      }
    }
  }

  fun assertBiometricsSupport() {
    val biometricManager = BiometricManager.from(context)
    @SuppressLint("SwitchIntDef") // BiometricManager.BIOMETRIC_SUCCESS shouldn't do anything
    when (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)) {
      BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE, BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE -> {
        throw AuthenticationException("No hardware available for biometric authentication. Use expo-local-authentication to check if the device supports it")
      }
      BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> {
        throw AuthenticationException("No biometrics are currently enrolled")
      }
      BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED -> {
        throw AuthenticationException("An update is required before the biometrics can be used")
      }
      BiometricManager.BIOMETRIC_ERROR_UNSUPPORTED -> {
        throw AuthenticationException("Biometric authentication is unsupported")
      }
      BiometricManager.BIOMETRIC_STATUS_UNKNOWN -> {
        throw AuthenticationException("Biometric authentication status is unknown")
      }
    }
  }

  private fun getCurrentActivity(): Activity? {
    val activityProvider: ActivityProvider = moduleRegistry.getModule(ActivityProvider::class.java)
    return activityProvider.currentActivity
  }

  companion object {
    const val REQUIRE_AUTHENTICATION_PROPERTY = "requireAuthentication"
  }
}
