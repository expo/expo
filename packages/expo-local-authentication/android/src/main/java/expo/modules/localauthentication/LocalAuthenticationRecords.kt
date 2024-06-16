package expo.modules.localauthentication

import androidx.biometric.BiometricManager
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

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

internal class AuthOptions : Record {
  @Field
  val promptMessage: String = ""

  @Field
  val cancelLabel: String = ""

  @Field
  val disableDeviceFallback: Boolean = false

  @Field
  val requireConfirmation: Boolean = true

  @Field
  val biometricsSecurityLevel: BiometricsSecurityLevel = BiometricsSecurityLevel.WEAK
}
