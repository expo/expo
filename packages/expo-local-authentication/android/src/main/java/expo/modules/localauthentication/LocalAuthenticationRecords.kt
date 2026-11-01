package expo.modules.localauthentication

import android.os.Build
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.OptimizedRecord

internal enum class BiometricsSecurityLevel(val value: String) : Enumerable {
  WEAK("weak"),
  STRONG("strong");

  fun toNativeBiometricSecurityLevel(): Int {
    return when (this) {
      WEAK -> BiometricManager.Authenticators.BIOMETRIC_WEAK
      STRONG -> BiometricManager.Authenticators.BIOMETRIC_STRONG
    }
  }
}

internal data class AuthenticatorSelection(
  val allowedAuthenticators: Int,
  // Whether the prompt's negative button opens the system's device credential confirmation,
  // because the prompt itself can't offer the device credential.
  val usesDeviceCredentialButton: Boolean
)

internal fun selectAuthenticators(
  securityLevel: BiometricsSecurityLevel,
  disableDeviceFallback: Boolean,
  apiLevel: Int
): AuthenticatorSelection {
  val biometricAuthenticators = securityLevel.toNativeBiometricSecurityLevel()
  if (disableDeviceFallback) {
    return AuthenticatorSelection(biometricAuthenticators, usesDeviceCredentialButton = false)
  }
  // `BIOMETRIC_STRONG or DEVICE_CREDENTIAL` makes `PromptInfo.Builder.build()` throw on API 28-29.
  // Allowing weak biometrics instead would let a Class 2 biometric pass the prompt, so the prompt
  // allows strong biometrics only and its negative button opens the system's device credential
  // confirmation. On API 29, that screen can first offer any biometric the system exposes.
  if (securityLevel == BiometricsSecurityLevel.STRONG &&
    apiLevel in Build.VERSION_CODES.P..Build.VERSION_CODES.Q
  ) {
    return AuthenticatorSelection(
      BiometricManager.Authenticators.BIOMETRIC_STRONG,
      usesDeviceCredentialButton = true
    )
  }
  return AuthenticatorSelection(
    biometricAuthenticators or BiometricManager.Authenticators.DEVICE_CREDENTIAL,
    usesDeviceCredentialButton = false
  )
}

internal fun shouldFallBackToDeviceCredential(
  errorCode: Int,
  disableDeviceFallback: Boolean,
  usesDeviceCredentialButton: Boolean
): Boolean {
  if (disableDeviceFallback) {
    return false
  }
  if (isBiometricUnavailable(errorCode)) {
    return true
  }
  // With the device credential button, tapping it opens the device credential. Lockouts open it
  // too, as the system does when the prompt itself offers the device credential.
  return usesDeviceCredentialButton && when (errorCode) {
    BiometricPrompt.ERROR_NEGATIVE_BUTTON,
    BiometricPrompt.ERROR_LOCKOUT,
    BiometricPrompt.ERROR_LOCKOUT_PERMANENT -> true

    else -> false
  }
}

internal fun negativeButtonText(
  selection: AuthenticatorSelection,
  disableDeviceFallback: Boolean,
  cancelLabel: String?,
  fallbackLabel: String?,
  defaultFallbackLabel: () -> CharSequence
): CharSequence? {
  if (selection.usesDeviceCredentialButton) {
    // `PromptInfo.Builder.build()` requires this button when the prompt can't offer the device
    // credential, so an empty label falls back to the default one.
    return fallbackLabel.takeUnless { it.isNullOrEmpty() } ?: defaultFallbackLabel()
  }
  if (disableDeviceFallback) {
    return cancelLabel
  }
  return null
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

@OptimizedRecord
internal class AuthOptions : Record {
  @Field
  val promptMessage: String = ""

  @Field
  val promptSubtitle: String? = null

  @Field
  val promptDescription: String? = null

  @Field
  val cancelLabel: String? = null

  @Field
  val fallbackLabel: String? = null

  @Field
  val disableDeviceFallback: Boolean = false

  @Field
  val requireConfirmation: Boolean = true

  @Field
  val biometricsSecurityLevel: BiometricsSecurityLevel = BiometricsSecurityLevel.WEAK
}
