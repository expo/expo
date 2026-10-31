// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.localauthentication

import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.annotation.UiThread
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.biometric.BiometricPrompt.PromptInfo
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.ActivityEventListener
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.exception.UnexpectedException
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.androidContext
import io.github.expo.modules.v2.react.currentActivity
import io.github.expo.modules.v2.react.reactContext
import io.github.expo.modules.v2.react.reactContextOrNull
import kotlinx.coroutines.CancellableContinuation
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.util.concurrent.Executor
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

private const val AUTHENTICATION_TYPE_FINGERPRINT = 1
private const val AUTHENTICATION_TYPE_FACIAL_RECOGNITION = 2
private const val AUTHENTICATION_TYPE_IRIS = 3
private const val SECURITY_LEVEL_NONE = 0
private const val SECURITY_LEVEL_SECRET = 1
private const val SECURITY_LEVEL_BIOMETRIC_WEAK = 2
private const val SECURITY_LEVEL_BIOMETRIC_STRONG = 3
private const val DEVICE_CREDENTIAL_FALLBACK_CODE = 6

/**
 * The pending result of one `authenticateAsync` call. Only the first `resolve` or `reject` settles it.
 */
private class AuthPromise(private val continuation: CancellableContinuation<Map<String, Any>>) {
  private val isSettled = AtomicBoolean(false)

  fun resolve(value: Map<String, Any>) {
    if (isSettled.compareAndSet(false, true)) {
      continuation.resume(value)
    }
  }

  fun reject(exception: Throwable) {
    if (isSettled.compareAndSet(false, true)) {
      continuation.resumeWithException(exception)
    }
  }
}

@ExpoModule("ExpoLocalAuthentication")
class LocalAuthenticationModule : Module() {
  private val activityEventListener = object : ActivityEventListener {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (requestCode == DEVICE_CREDENTIAL_FALLBACK_CODE) {
        if (resultCode == Activity.RESULT_OK) {
          activePromise?.resolve(createResponse())
        } else {
          activePromise?.resolve(
            createResponse(
              error = "user_cancel",
              warning = "Device Credentials canceled"
            )
          )
        }

        isAuthenticating = false
        isRetryingWithDeviceCredentials = false
        biometricPrompt = null
        activePromise = null
      } else if (activity is FragmentActivity) {
        // If the user uses PIN as an authentication method, the result will be passed to the `onActivityResult`.
        // Unfortunately, react-native doesn't pass this value to the underlying fragment - we won't resolve the promise.
        // So we need to do it manually.
        val fragment = activity.supportFragmentManager.findFragmentByTag("androidx.biometric.BiometricFragment")
        fragment?.onActivityResult(requestCode and 0xffff, resultCode, data)
      }
    }

    override fun onNewIntent(intent: Intent) = Unit
  }

  override fun onDestroy() {
    reactContextOrNull?.removeActivityEventListener(activityEventListener)
  }

  @JS
  suspend fun supportedAuthenticationTypesAsync(): List<Int> = withContext(Dispatchers.IO) {
    val results = mutableSetOf<Int>()
    if (canAuthenticateUsingWeakBiometrics() == BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE) {
      return@withContext results.toList()
    }

    // note(cedric): replace hardcoded system feature strings with constants from
    // PackageManager when dropping support for Android SDK 28
    results.apply {
      addIf(hasSystemFeature("android.hardware.fingerprint"), AUTHENTICATION_TYPE_FINGERPRINT)
      addIf(hasSystemFeature("android.hardware.biometrics.face"), AUTHENTICATION_TYPE_FACIAL_RECOGNITION)
      addIf(hasSystemFeature("android.hardware.biometrics.iris"), AUTHENTICATION_TYPE_IRIS)
      addIf(hasSystemFeature("com.samsung.android.bio.face"), AUTHENTICATION_TYPE_FACIAL_RECOGNITION)
    }

    results.toList()
  }

  @JS
  suspend fun hasHardwareAsync(): Boolean = withContext(Dispatchers.IO) {
    canAuthenticateUsingWeakBiometrics() != BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE
  }

  @JS
  suspend fun isEnrolledAsync(): Boolean = withContext(Dispatchers.IO) {
    canAuthenticateUsingWeakBiometrics() == BiometricManager.BIOMETRIC_SUCCESS
  }

  @JS
  suspend fun getEnrolledLevelAsync(): Int = withContext(Dispatchers.IO) {
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
    level
  }

  @JS
  suspend fun authenticateAsync(options: AuthOptions): Map<String, Any> {
    val fragmentActivity = currentActivity as? FragmentActivity ?: throw Exceptions.MissingActivity()
    if (!keyguardManager.isDeviceSecure) {
      return createResponse(
        error = "not_enrolled",
        warning = "KeyguardManager#isDeviceSecure() returned false"
      )
    }

    reactContext.addActivityEventListener(activityEventListener)

    // BiometricPrompt callbacks are invoked on the main thread so also run this there to avoid
    // having to do locking.
    return withContext(Dispatchers.Main) {
      suspendCancellableCoroutine { continuation ->
        authenticate(fragmentActivity, options, AuthPromise(continuation))
      }
    }
  }

  @JS
  suspend fun cancelAuthenticate(): Unit = withContext(Dispatchers.Main) {
    val current = activePromise
    val currentPrompt = biometricPrompt
    activePromise = null
    biometricPrompt = null
    isAuthenticating = false
    isRetryingWithDeviceCredentials = false
    currentPrompt?.cancelAuthentication()
    current?.resolve(createResponse(error = "user_cancel"))
  }

  private val keyguardManager: KeyguardManager
    get() = androidContext.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager

  private val biometricManager by lazy { BiometricManager.from(androidContext) }
  private val packageManager by lazy { androidContext.packageManager }
  private var biometricPrompt: BiometricPrompt? = null
  private var activePromise: AuthPromise? = null
  private var isRetryingWithDeviceCredentials = false
  private var isAuthenticating = false

  private fun buildAuthenticationCallback(
    callPromise: AuthPromise,
    callOptions: AuthOptions
  ): BiometricPrompt.AuthenticationCallback = object : BiometricPrompt.AuthenticationCallback() {
    override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
      finishCall(callPromise) {
        callPromise.resolve(
          mapOf("success" to true)
        )
      }
    }

    override fun onAuthenticationError(errMsgId: Int, errString: CharSequence) {
      if (
        isBiometricUnavailable(errMsgId) &&
        isDeviceSecure &&
        !isRetryingWithDeviceCredentials &&
        !callOptions.disableDeviceFallback &&
        activePromise === callPromise
      ) {
        isRetryingWithDeviceCredentials = true
        promptDeviceCredentialsFallback(callOptions, callPromise)
        return
      }
      finishCall(callPromise) {
        callPromise.resolve(
          createResponse(
            error = convertErrorCode(errMsgId),
            warning = errString.toString()
          )
        )
      }
    }
  }

  // Drop late callbacks for a call whose promise was already settled by another path (e.g. cancelAuthenticate).
  private inline fun finishCall(callPromise: AuthPromise, resolve: () -> Unit) {
    if (activePromise !== callPromise) {
      return
    }
    activePromise = null
    biometricPrompt = null
    isAuthenticating = false
    isRetryingWithDeviceCredentials = false
    resolve()
  }

  @UiThread
  private fun authenticate(fragmentActivity: FragmentActivity, options: AuthOptions, promise: AuthPromise) {
    if (isAuthenticating) {
      // Reject the new call rather than supersede. AndroidX `BiometricPrompt` won't show a
      // replacement prompt while the previous fragment is still detaching
      promise.resolve(createResponse(error = "app_cancel"))
      return
    }

    val allowedAuthenticators = if (options.disableDeviceFallback) {
      options.biometricsSecurityLevel.toNativeBiometricSecurityLevel()
    } else {
      options.biometricsSecurityLevel.toNativeBiometricSecurityLevel() or BiometricManager.Authenticators.DEVICE_CREDENTIAL
    }

    isAuthenticating = true
    activePromise = promise
    val executor: Executor = Executors.newSingleThreadExecutor()
    val localBiometricPrompt = BiometricPrompt(fragmentActivity, executor, buildAuthenticationCallback(promise, options))
    biometricPrompt = localBiometricPrompt
    val promptInfoBuilder = PromptInfo.Builder().apply {
      setTitle(options.promptMessage)
      setSubtitle(options.promptSubtitle)
      setDescription(options.promptDescription)
      setAllowedAuthenticators(allowedAuthenticators)
      if (options.disableDeviceFallback && options.cancelLabel != null) {
        setNegativeButtonText(options.cancelLabel)
      }
      setConfirmationRequired(options.requireConfirmation)
    }

    val promptInfo = promptInfoBuilder.build()
    try {
      localBiometricPrompt.authenticate(promptInfo)
    } catch (e: NullPointerException) {
      finishCall(promise) {
        promise.reject(UnexpectedException("Canceled authentication due to an internal error", e))
      }
    }
  }

  private fun promptDeviceCredentialsFallback(options: AuthOptions, promise: AuthPromise) {
    val fragmentActivity = currentActivity as? FragmentActivity
    if (fragmentActivity == null) {
      finishCall(promise) {
        promise.resolve(
          createResponse(
            error = "not_available",
            warning = "getCurrentActivity() returned null"
          )
        )
      }
      return
    }

    val promptMessage = options.promptMessage
    val promptDescription = options.promptDescription

    // BiometricPrompt callbacks are invoked on the main thread so also run this there to avoid
    // having to do locking.
    Handler(Looper.getMainLooper()).post {
      // On Android devices older than 11, we need to use Keyguard to unlock by Device Credentials.
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
        val credentialConfirmationIntent = keyguardManager.createConfirmDeviceCredentialIntent(promptMessage, promptDescription)
        fragmentActivity.startActivityForResult(credentialConfirmationIntent, DEVICE_CREDENTIAL_FALLBACK_CODE)
        return@post
      }

      val executor: Executor = Executors.newSingleThreadExecutor()
      val localBiometricPrompt = BiometricPrompt(fragmentActivity, executor, buildAuthenticationCallback(promise, options))

      biometricPrompt = localBiometricPrompt

      val promptInfoBuilder = PromptInfo.Builder().apply {
        setTitle(promptMessage)
        setSubtitle(options.promptSubtitle)
        setDescription(promptDescription)
        setAllowedAuthenticators(BiometricManager.Authenticators.DEVICE_CREDENTIAL)
        setConfirmationRequired(options.requireConfirmation)
      }

      val promptInfo = promptInfoBuilder.build()
      try {
        localBiometricPrompt.authenticate(promptInfo)
      } catch (e: NullPointerException) {
        finishCall(promise) {
          promise.reject(UnexpectedException("Canceled authentication due to an internal error", e))
        }
      }
    }
  }

  private fun hasSystemFeature(feature: String) = packageManager.hasSystemFeature(feature)

  // NOTE: `KeyguardManager#isKeyguardSecure()` considers SIM locked state,
  // but it will be ignored on falling-back to device credential on biometric authentication.
  // That means, setting level to `SECURITY_LEVEL_SECRET` might be misleading for some users.
  // But there is no equivalent APIs prior to M.
  // `androidx.biometric.BiometricManager#canAuthenticate(int)` looks like an alternative,
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
  ): Map<String, Any> = buildMap {
    put("success", error == null)
    error?.let {
      put("error", it)
    }
    warning?.let {
      put("warning", it)
    }
  }
}

fun <T> MutableSet<T>.addIf(condition: Boolean, valueToAdd: T) {
  if (condition) {
    add(valueToAdd)
  }
}
