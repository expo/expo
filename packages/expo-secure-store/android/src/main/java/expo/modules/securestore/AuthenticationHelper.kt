package expo.modules.securestore

import android.app.Activity
import android.content.Context
import android.os.Build
import android.util.Log
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.biometric.BiometricPrompt.PromptInfo
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import expo.modules.core.ModuleRegistry
import expo.modules.core.Promise
import expo.modules.core.arguments.ReadableArguments
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.services.UIManager
import org.json.JSONException
import org.json.JSONObject
import java.security.GeneralSecurityException
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec

class AuthenticationHelper(
  private val context: Context,
  private val moduleRegistry: ModuleRegistry
) {
  companion object {
    private const val AUTHENTICATION_PROMPT_PROPERTY = "authenticationPrompt"
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
      options: ReadableArguments,
      encryptionCallback: EncryptionCallback,
      postEncryptionCallback: PostEncryptionCallback?
    ) {
      val requiresAuthentication = options.getBoolean(REQUIRE_AUTHENTICATION_PROPERTY, false)

      checkAuthentication(
        promise, requiresAuthentication, cipher, gcmParameterSpec, options, encryptionCallback, postEncryptionCallback
      )
    }

    override fun checkAuthentication(
      promise: Promise,
      requiresAuthentication: Boolean,
      cipher: Cipher,
      gcmParameterSpec: GCMParameterSpec,
      options: ReadableArguments,
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

  fun handleEncryptionCallback(
    promise: Promise,
    encryptionCallback: EncryptionCallback,
    cipher: Cipher,
    gcmParameterSpec: GCMParameterSpec,
    postEncryptionCallback: PostEncryptionCallback?
  ) {
    try {
      encryptionCallback.run(promise, cipher, gcmParameterSpec, postEncryptionCallback)
    } catch (exception: GeneralSecurityException) {
      Log.w(SecureStoreModule.TAG, exception)
      promise.reject(
        "ERR_SECURESTORE_ENCRYPT_FAILURE",
        "Could not encrypt/decrypt the value for SecureStore",
        exception
      )
    } catch (exception: JSONException) {
      Log.w(SecureStoreModule.TAG, exception)
      promise.reject(
        "ERR_SECURESTORE_ENCODE_FAILURE",
        "Could not create an encrypted JSON item for SecureStore",
        exception
      )
    }
  }

  private fun openAuthenticationPrompt(
    promise: Promise,
    options: ReadableArguments,
    encryptionCallback: EncryptionCallback,
    cipher: Cipher,
    gcmParameterSpec: GCMParameterSpec,
    postEncryptionCallback: PostEncryptionCallback?
  ) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      promise.reject(
        "ERR_SECURESTORE_AUTH_NOT_AVAILABLE",
        "Biometric authentication requires Android API 23"
      )
      return
    }
    if (isAuthenticating) {
      promise.reject(
        "ERR_SECURESTORE_AUTH_IN_PROGRESS",
        "Authentication is already in progress"
      )
      return
    }

    val biometricManager = BiometricManager.from(context)
    when (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)) {
      BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE, BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE -> {
        promise.reject(
          "ERR_SECURESTORE_AUTH_NOT_AVAILABLE",
          "No hardware available for biometric authentication. Use expo-local-authentication to check if the device supports it."
        )
        return
      }
      BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> {
        promise.reject(
          "ERR_SECURESTORE_AUTH_NOT_CONFIGURED",
          "No biometrics are currently enrolled"
        )
        return
      }
    }

    val title = options.getString(AUTHENTICATION_PROMPT_PROPERTY, " ")

    val promptInfo = PromptInfo.Builder()
      .setTitle(title)
      .setNegativeButtonText(context.getString(android.R.string.cancel))
      .build()
    val fragmentActivity = getCurrentActivity() as FragmentActivity?
    if (fragmentActivity == null) {
      promise.reject(
        "ERR_SECURESTORE_APP_BACKGROUNDED",
        "Cannot display biometric prompt when the app is not in the foreground"
      )
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
                gcmParameterSpec,
                { promise, result ->
                  val obj = result as JSONObject
                  obj.put(REQUIRE_AUTHENTICATION_PROPERTY, true)
                  postEncryptionCallback?.run(promise, result)
                }
              )
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
              super.onAuthenticationError(errorCode, errString)
              isAuthenticating = false

              if (errorCode == BiometricPrompt.ERROR_USER_CANCELED || errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON) {
                promise.reject(
                  "ERR_SECURESTORE_AUTH_CANCELLED",
                  "User canceled the authentication"
                )
              } else {
                promise.reject(
                  "ERR_SECURESTORE_AUTH_FAILURE",
                  "Could not authenticate the user"
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
