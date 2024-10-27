// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.localauthentication

import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.os.Build
import android.os.Bundle
import androidx.annotation.UiThread
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.biometric.BiometricPrompt.PromptInfo
import androidx.fragment.app.FragmentActivity
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.launch
import java.util.concurrent.Executor
import java.util.concurrent.Executors

private const val AUTHENTICATION_TYPE_FINGERPRINT = 1
private const val AUTHENTICATION_TYPE_FACIAL_RECOGNITION = 2
private const val AUTHENTICATION_TYPE_IRIS = 3
private const val SECURITY_LEVEL_NONE = 0
private const val SECURITY_LEVEL_SECRET = 1
private const val SECURITY_LEVEL_BIOMETRIC_WEAK = 2
private const val SECURITY_LEVEL_BIOMETRIC_STRONG = 3
private const val DEVICE_CREDENTIAL_FALLBACK_CODE = 6

class LocalAuthenticationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoLocalAuthentication")

    AsyncFunction<Set<Int>>("supportedAuthenticationTypesAsync") {
      val results = mutableSetOf<Int>()
      if (canAuthenticateUsingWeakBiometrics() == BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE) {
        return@AsyncFunction results
      }

      // note(cedric): replace hardcoded system feature strings with constants from
      // PackageManager when dropping support for Android SDK 28
      results.apply {
        addIf(hasSystemFeature("android.hardware.fingerprint"), AUTHENTICATION_TYPE_FINGERPRINT)
        addIf(hasSystemFeature("android.hardware.biometrics.face"), AUTHENTICATION_TYPE_FACIAL_RECOGNITION)
        addIf(hasSystemFeature("android.hardware.biometrics.iris"), AUTHENTICATION_TYPE_IRIS)
        addIf(hasSystemFeature("com.samsung.android.bio.face"), AUTHENTICATION_TYPE_FACIAL_RECOGNITION)
      }

      return@AsyncFunction results
    }

    AsyncFunction<Boolean>("hasHardwareAsync") {
      canAuthenticateUsingWeakBiometrics() != BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE
    }

    AsyncFunction<Boolean>("isEnrolledAsync") {
      canAuthenticateUsingWeakBiometrics() == BiometricManager.BIOMETRIC_SUCCESS
    }

    AsyncFunction<Int>("getEnrolledLevelAsync") {
      var level = SECURITY_LEVEL_NONE
      if (isDeviceSecure) {
        level = SECURITY_LEVEL_SECRET
      }
      if (canAuthenticateUsingWeakBiometrics() == BiometricManager.BIOMETRIC_SUCCESS) {
        level = SECURITY_LEVEL_BIOMETRIC_WEAK
      }
      if (canAuthenticateUsingStrongBiometrics() == BiometricManager.BIOMETRIC_SUCCESS) {
        level = SECURITY_LEVEL_BIOMETRIC_STRONG
      }
      return@AsyncFunction level
    }

    AsyncFunction("authenticateAsync") { options: AuthOptions, promise: Promise ->
      val fragmentActivity = appContext.throwingActivity as? FragmentActivity
      if (fragmentActivity == null) {
        promise.reject(Exceptions.MissingActivity())
        return@AsyncFunction
      }
      if (!keyguardManager.isDeviceSecure) {
        promise.resolve(
          createResponse(
            error = "not_enrolled",
            warning = "KeyguardManager#isDeviceSecure() returned false"
          )
        )
        return@AsyncFunction
      }

      this@LocalAuthenticationModule.authOptions = options

      // BiometricPrompt callbacks are invoked on the main thread so also run this there to avoid
      // having to do locking.
      appContext.mainQueue.launch {
        authenticate(fragmentActivity, options, promise)
      }
    }

    AsyncFunction<Unit>("cancelAuthenticate") {
      biometricPrompt?.cancelAuthentication()
      isAuthenticating = false
    }.runOnQueue(Queues.MAIN)

    OnActivityResult { activity, (requestCode, resultCode, data) ->
      if (requestCode == DEVICE_CREDENTIAL_FALLBACK_CODE) {
        if (resultCode == Activity.RESULT_OK) {
          promise?.resolve(createResponse())
        } else {
          promise?.resolve(
            createResponse(
              error = "user_cancel",
              warning = "Device Credentials canceled"
            )
          )
        }

        isAuthenticating = false
        isRetryingWithDeviceCredentials = false
        biometricPrompt = null
        promise = null
        authOptions = null
      } else if (activity is FragmentActivity) {
        // If the user uses PIN as an authentication method, the result will be passed to the `onActivityResult`.
        // Unfortunately, react-native doesn't pass this value to the underlying fragment - we won't resolve the promise.
        // So we need to do it manually.
        val fragment = activity.supportFragmentManager.findFragmentByTag("androidx.biometric.BiometricFragment")
        fragment?.onActivityResult(requestCode and 0xffff, resultCode, data)
      }
    }
  }

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val keyguardManager: KeyguardManager
    get() = context.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager

  private val biometricManager by lazy { BiometricManager.from(context) }
  private val packageManager by lazy { context.packageManager }
  private var biometricPrompt: BiometricPrompt? = null
  private var promise: Promise? = null
  private var authOptions: AuthOptions? = null
  private var isRetryingWithDeviceCredentials = false
  private var isAuthenticating = false

  private val authenticationCallback: BiometricPrompt.AuthenticationCallback = object : BiometricPrompt.AuthenticationCallback() {
    override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
      isAuthenticating = false
      isRetryingWithDeviceCredentials = false
      biometricPrompt = null
      promise?.resolve(
        Bundle().apply {
          putBoolean("success", true)
        }
      )
      promise = null
      authOptions = null
    }

    override fun onAuthenticationError(errMsgId: Int, errString: CharSequence) {
      // Make sure to fallback to the Device Credentials if the Biometrics hardware is unavailable.
      if (isBiometricUnavailable(errMsgId) && isDeviceSecure && !isRetryingWithDeviceCredentials) {
        val options = authOptions

        if (options != null) {
          val disableDeviceFallback = options.disableDeviceFallback

          // Don't run the device credentials fallback if it's disabled.
          if (!disableDeviceFallback) {
            promise?.let {
              isRetryingWithDeviceCredentials = true
              promptDeviceCredentialsFallback(options, it)
              return
            }
          }
        }
      }

      isAuthenticating = false
      isRetryingWithDeviceCredentials = false
      biometricPrompt = null
      promise?.resolve(
        createResponse(
          error = convertErrorCode(errMsgId),
          warning = errString.toString()
        )
      )
      promise = null
      authOptions = null
    }
  }

  @UiThread
  private fun authenticate(fragmentActivity: FragmentActivity, options: AuthOptions, promise: Promise) {
    if (isAuthenticating) {
      this.promise?.resolve(
        createResponse(
          error = "app_cancel"
        )
      )
      this.promise = promise
      return
    }

    val promptMessage = options.promptMessage
    val cancelLabel = options.cancelLabel
    val requireConfirmation = options.requireConfirmation
    val allowedAuthenticators = if (options.disableDeviceFallback) {
      options.biometricsSecurityLevel.toNativeBiometricSecurityLevel()
    } else {
      options.biometricsSecurityLevel.toNativeBiometricSecurityLevel() or BiometricManager.Authenticators.DEVICE_CREDENTIAL
    }

    isAuthenticating = true
    this.promise = promise
    val executor: Executor = Executors.newSingleThreadExecutor()
    biometricPrompt = BiometricPrompt(fragmentActivity, executor, authenticationCallback)
    val promptInfoBuilder = PromptInfo.Builder().apply {
      setTitle(promptMessage)
      setAllowedAuthenticators(allowedAuthenticators)
      if (options.disableDeviceFallback) {
        setNegativeButtonText(cancelLabel)
      }
      setConfirmationRequired(requireConfirmation)
    }

    val promptInfo = promptInfoBuilder.build()
    try {
      biometricPrompt!!.authenticate(promptInfo)
    } catch (e: NullPointerException) {
      promise.reject(UnexpectedException("Canceled authentication due to an internal error", e))
    }
  }

  private fun promptDeviceCredentialsFallback(options: AuthOptions, promise: Promise) {
    val fragmentActivity = appContext.throwingActivity as FragmentActivity?
    if (fragmentActivity == null) {
      promise.resolve(
        createResponse(
          error = "not_available",
          warning = "getCurrentActivity() returned null"
        )
      )
      return
    }

    val promptMessage = options.promptMessage
    val requireConfirmation = options.requireConfirmation

    // BiometricPrompt callbacks are invoked on the main thread so also run this there to avoid
    // having to do locking.
    appContext.mainQueue.launch {
      // On Android devices older than 11, we need to use Keyguard to unlock by Device Credentials.
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
        val credentialConfirmationIntent = keyguardManager.createConfirmDeviceCredentialIntent(promptMessage, "")
        fragmentActivity.startActivityForResult(credentialConfirmationIntent, DEVICE_CREDENTIAL_FALLBACK_CODE)
        return@launch
      }

      val executor: Executor = Executors.newSingleThreadExecutor()
      val localBiometricPrompt = BiometricPrompt(fragmentActivity, executor, authenticationCallback)

      biometricPrompt = localBiometricPrompt

      val promptInfoBuilder = PromptInfo.Builder().apply {
        setTitle(promptMessage)
        setAllowedAuthenticators(BiometricManager.Authenticators.DEVICE_CREDENTIAL)
        setConfirmationRequired(requireConfirmation)
      }

      val promptInfo = promptInfoBuilder.build()
      try {
        localBiometricPrompt.authenticate(promptInfo)
      } catch (e: NullPointerException) {
        promise.reject(UnexpectedException("Canceled authentication due to an internal error", e))
      }
    }
  }

  private fun hasSystemFeature(feature: String) = packageManager.hasSystemFeature(feature)

  // NOTE: `KeyguardManager#isKeyguardSecure()` considers SIM locked state,
  // but it will be ignored on falling-back to device credential on biometric authentication.
  // That means, setting level to `SECURITY_LEVEL_SECRET` might be misleading for some users.
  // But there is no equivalent APIs prior to M.
  // `andriodx.biometric.BiometricManager#canAuthenticate(int)` looks like an alternative,
  // but specifying `BiometricManager.Authenticators.DEVICE_CREDENTIAL` alone is not
  // supported prior to API 30.
  // https://developer.android.com/reference/androidx/biometric/BiometricManager#canAuthenticate(int)
  private val isDeviceSecure: Boolean
    get() = keyguardManager.isDeviceSecure

  private fun convertErrorCode(code: Int): String {
    return when (code) {
      BiometricPrompt.ERROR_CANCELED, BiometricPrompt.ERROR_NEGATIVE_BUTTON, BiometricPrompt.ERROR_USER_CANCELED -> "user_cancel"
      BiometricPrompt.ERROR_HW_NOT_PRESENT, BiometricPrompt.ERROR_HW_UNAVAILABLE, BiometricPrompt.ERROR_NO_BIOMETRICS, BiometricPrompt.ERROR_NO_DEVICE_CREDENTIAL -> "not_available"
      BiometricPrompt.ERROR_LOCKOUT, BiometricPrompt.ERROR_LOCKOUT_PERMANENT -> "lockout"
      BiometricPrompt.ERROR_NO_SPACE -> "no_space"
      BiometricPrompt.ERROR_TIMEOUT -> "timeout"
      BiometricPrompt.ERROR_UNABLE_TO_PROCESS -> "unable_to_process"
      else -> "unknown"
    }
  }

  private fun isBiometricUnavailable(code: Int): Boolean {
    return when (code) {
      BiometricPrompt.ERROR_HW_NOT_PRESENT,
      BiometricPrompt.ERROR_HW_UNAVAILABLE,
      BiometricPrompt.ERROR_NO_BIOMETRICS,
      BiometricPrompt.ERROR_UNABLE_TO_PROCESS,
      BiometricPrompt.ERROR_NO_SPACE -> true

      else -> false
    }
  }

  private fun canAuthenticateUsingWeakBiometrics(): Int =
    biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_WEAK)

  private fun canAuthenticateUsingStrongBiometrics(): Int =
    biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)

  private fun createResponse(
    error: String? = null,
    warning: String? = null
  ) = Bundle().apply {
    putBoolean("success", error == null)
    error?.let {
      putString("error", it)
    }
    warning?.let {
      putString("warning", it)
    }
  }
}

fun <T> MutableSet<T>.addIf(condition: Boolean, valueToAdd: T) {
  if (condition) {
    add(valueToAdd)
  }
}
