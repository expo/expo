package expo.modules.localauthentication

import android.os.Build
import androidx.biometric.BiometricManager
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
  val fallbackToWeakUsed: Boolean
)

internal fun selectAuthenticators(
  securityLevel: BiometricsSecurityLevel,
  disableDeviceFallback: Boolean,
  apiLevel: Int
): AuthenticatorSelection {
  val biometricAuthenticators = securityLevel.toNativeBiometricSecurityLevel()
  if (disableDeviceFallback) {
    return AuthenticatorSelection(biometricAuthenticators, fallbackToWeakUsed = false)
  }
  // `BIOMETRIC_STRONG or DEVICE_CREDENTIAL` makes `PromptInfo.Builder.build()` throw on API 28-29.
  // Since the device credential fallback already caps the security level at the lock screen,
  // fall back to weak biometrics (Class 2 or better, so strong sensors keep working) instead of
  // crashing on those API levels.
  if (securityLevel == BiometricsSecurityLevel.STRONG &&
    apiLevel in Build.VERSION_CODES.P..Build.VERSION_CODES.Q
  ) {
    return AuthenticatorSelection(
      BiometricManager.Authenticators.BIOMETRIC_WEAK or BiometricManager.Authenticators.DEVICE_CREDENTIAL,
      fallbackToWeakUsed = true
    )
  }
  return AuthenticatorSelection(
    biometricAuthenticators or BiometricManager.Authenticators.DEVICE_CREDENTIAL,
    fallbackToWeakUsed = false
  )
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
  val disableDeviceFallback: Boolean = false

  @Field
  val requireConfirmation: Boolean = true

  @Field
  val biometricsSecurityLevel: BiometricsSecurityLevel = BiometricsSecurityLevel.WEAK
}
