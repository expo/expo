package expo.modules.securestore

import android.app.Activity
import android.content.Context
import android.os.Build
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.biometric.BiometricPrompt.PromptInfo
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import expo.modules.core.ModuleRegistry
import expo.modules.kotlin.Promise
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.services.UIManager
import expo.modules.securestore.callbacks.AuthenticationCallback
import expo.modules.securestore.callbacks.EncryptionCallback
import expo.modules.securestore.callbacks.PostEncryptionCallback
import org.json.JSONException
import org.json.JSONObject
import java.security.GeneralSecurityException
import javax.crypto.Cipher
import javax.crypto.IllegalBlockSizeException
import javax.crypto.spec.GCMParameterSpec

class AuthenticationHelper(
  private val context: Context,
  private val moduleRegistry: ModuleRegistry
) {
  companion object {
    const val REQUIRE_AUTHENTICATION_PROPERTY = "requireAuthentication"
  }

  private val uiManager = moduleRegistry.getModule(UIManager::class.java)
  private var isAuthenticating = false

  // Authentication callback decides whether the operation requires authentication (either by
  // requiresAuthentication argument, or from options). When item needs to be encrypted/decrypted an
  // instance of Authentication callback is passed to the relevant method.
  // The method prepares the cipher and starts authentication callback with it. If the operation
  // requires authentication, the biometric prompt is shown, otherwise the encryption callback
  // is called.
  // When the user is authenticated the encryption callback is ran with the unlocked cipher and does
  // encryption/decryption. Finally the PostEncryptionCallback may be ran with the object returned
  // by previous callback (to save encrypted data to SharedPreferences).

  val defaultCallback: AuthenticationCallback = object : AuthenticationCallback {
    override fun checkAuthentication(
      promise: Promise,
      cipher: Cipher,
      gcmParameterSpec: GCMParameterSpec,
      options: SecureStoreOptions,
      encryptionCallback: EncryptionCallback,
      postEncryptionCallback: PostEncryptionCallback?
    ) {
      val requiresAuthentication = options.requireAuthentication

      checkAuthentication(
        promise, requiresAuthentication, cipher, gcmParameterSpec, options, encryptionCallback, postEncryptionCallback
      )
    }

    @Throws(GeneralSecurityException::class, JSONException::class, IllegalBlockSizeException::class)
    override fun checkAuthentication(
      promise: Promise,
      requiresAuthentication: Boolean,
      cipher: Cipher,
      gcmParameterSpec: GCMParameterSpec,
      options: SecureStoreOptions,
      encryptionCallback: EncryptionCallback,
      postEncryptionCallback: PostEncryptionCallback?
    ) {
      if (requiresAuthentication) {
        openAuthenticationPrompt(promise, options, encryptionCallback, cipher, gcmParameterSpec, postEncryptionCallback)
      } else {
        handleEncryptionCallback(promise, encryptionCallback, cipher, gcmParameterSpec, postEncryptionCallback)
      }
    }
  }

  @Throws(GeneralSecurityException::class, JSONException::class, IllegalBlockSizeException::class)
  fun handleEncryptionCallback(
    promise: Promise,
    encryptionCallback: EncryptionCallback,
    cipher: Cipher,
    gcmParameterSpec: GCMParameterSpec,
    postEncryptionCallback: PostEncryptionCallback?
  ) {
    encryptionCallback.run(promise, cipher, gcmParameterSpec, postEncryptionCallback)
  }

  private fun openAuthenticationPrompt(
    promise: Promise,
    options: SecureStoreOptions,
    encryptionCallback: EncryptionCallback,
    cipher: Cipher,
    gcmParameterSpec: GCMParameterSpec,
    postEncryptionCallback: PostEncryptionCallback?
  ) {
    // TODO: Replace with proper exceptions
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      promise.reject(
        "ERR_SECURESTORE_AUTH_NOT_AVAILABLE",
        "Biometric authentication requires Android API 23", null
      )
      return
    }
    if (isAuthenticating) {
      promise.reject(
        "ERR_SECURESTORE_AUTH_IN_PROGRESS",
        "Authentication is already in progress", null
      )
      return
    }

    val biometricManager = BiometricManager.from(context)
    when (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)) {
      BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE, BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE -> {
        promise.reject(
          AuthenticationException("No hardware available for biometric authentication. Use expo-local-authentication to check if the device supports it.", null)
        )
        return
      }
      BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> {
        promise.reject(AuthenticationException("No biometrics are currently enrolled", null))
        return
      }
    }

    val title = options.authenticationPrompt

    val promptInfo = PromptInfo.Builder()
      .setTitle(title)
      .setNegativeButtonText(context.getString(android.R.string.cancel))
      .build()
    val fragmentActivity = getCurrentActivity() as FragmentActivity?
    if (fragmentActivity == null) {
      promise.reject(AuthenticationException("Cannot display biometric prompt when the app is not in the foreground", null))
      return
    }

    uiManager.runOnUiQueueThread(
      Runnable {
        isAuthenticating = true

        BiometricPrompt(
          fragmentActivity,
          ContextCompat.getMainExecutor(context),
          object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
              super.onAuthenticationSucceeded(result)
              isAuthenticating = false

              val cipher = result.cryptoObject!!.cipher!!
              handleEncryptionCallback(
                promise,
                encryptionCallback,
                cipher,
                gcmParameterSpec
              ) { promise, result ->
                val obj = result as JSONObject
                obj.put(REQUIRE_AUTHENTICATION_PROPERTY, true)
                postEncryptionCallback?.run(promise, result)
              }
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
              super.onAuthenticationError(errorCode, errString)
              isAuthenticating = false

              if (errorCode == BiometricPrompt.ERROR_USER_CANCELED || errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON) {
                promise.reject(
                  AuthenticationException("User canceled the authentication", null)
                )
              } else {
                promise.reject(
                  AuthenticationException("Could not authenticate the user", null)
                )
              }
            }
          }
        ).authenticate(promptInfo, BiometricPrompt.CryptoObject(cipher))
      }
    )
  }

  private fun getCurrentActivity(): Activity? {
    val activityProvider: ActivityProvider = moduleRegistry.getModule(ActivityProvider::class.java)
    return activityProvider.currentActivity
  }
}
