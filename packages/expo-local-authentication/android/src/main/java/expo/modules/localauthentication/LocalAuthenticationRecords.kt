package expo.modules.localauthentication

import androidx.biometric.BiometricManager
import io.github.expo.modules.v2.Enumerable
import io.github.expo.modules.v2.Record

enum class BiometricsSecurityLevel(val value: String) : Enumerable {
  WEAK("weak"),
  STRONG("strong");

  fun toNativeBiometricSecurityLevel(): Int {
    return when (this) {
      WEAK -> BiometricManager.Authenticators.BIOMETRIC_WEAK
      STRONG -> BiometricManager.Authenticators.BIOMETRIC_STRONG
    }
  }
}

@Record
data class AuthOptions(
  val promptMessage: String = "",
  val promptSubtitle: String? = null,
  val promptDescription: String? = null,
  val cancelLabel: String? = null,
  val disableDeviceFallback: Boolean = false,
  val requireConfirmation: Boolean = true,
  val biometricsSecurityLevel: BiometricsSecurityLevel = BiometricsSecurityLevel.WEAK
)
