package expo.modules.securestore

import android.content.Context
import androidx.biometric.BiometricPrompt
import androidx.biometric.BiometricPrompt.PromptInfo
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import java.util.concurrent.Executor
import javax.crypto.Cipher
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

class AuthenticationPrompt(private val currentActivity: FragmentActivity, context: Context, title: String) {
  private var executor: Executor = ContextCompat.getMainExecutor(context)
  private var promptInfo = PromptInfo.Builder()
    .setTitle(title)
    .setNegativeButtonText(context.getString(android.R.string.cancel))
    .build()

  suspend fun authenticate(cipher: Cipher): BiometricPrompt.AuthenticationResult? =
    suspendCoroutine { continuation ->
      BiometricPrompt(
        currentActivity,
        executor,
        object : BiometricPrompt.AuthenticationCallback() {
          override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
            super.onAuthenticationError(errorCode, errString)

            val errorType = convertErrorCode(errorCode)
            val message = "$errorType. $errString"
            continuation.resumeWithException(AuthenticationException(message))
          }

          override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
            super.onAuthenticationSucceeded(result)
            continuation.resume(result)
          }
        }
      ).authenticate(promptInfo, BiometricPrompt.CryptoObject(cipher))
    }

  private fun convertErrorCode(code: Int): String {
    return when (code) {
      BiometricPrompt.ERROR_USER_CANCELED -> "User canceled the authentication"
      BiometricPrompt.ERROR_NEGATIVE_BUTTON -> "User canceled the authentication"
      BiometricPrompt.ERROR_HW_NOT_PRESENT -> "Hardware not present"
      BiometricPrompt.ERROR_HW_UNAVAILABLE -> "Hardware unavailable"
      BiometricPrompt.ERROR_NO_BIOMETRICS -> "No biometrics enrolled"
      BiometricPrompt.ERROR_NO_DEVICE_CREDENTIAL -> "No device credential"
      BiometricPrompt.ERROR_LOCKOUT -> "Lockout"
      BiometricPrompt.ERROR_LOCKOUT_PERMANENT -> "Lockout permanent"
      BiometricPrompt.ERROR_NO_SPACE -> "No space"
      BiometricPrompt.ERROR_TIMEOUT -> "Timeout"
      BiometricPrompt.ERROR_UNABLE_TO_PROCESS -> "Unable to process"
      BiometricPrompt.ERROR_VENDOR -> "Vendor error"
      else -> "Unknown error (code: $code)"
    }
  }
}
