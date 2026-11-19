package expo.modules.localauthentication

import android.os.Build
import androidx.biometric.BiometricManager.Authenticators
import androidx.biometric.BiometricPrompt
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

// API levels around the range where `BIOMETRIC_STRONG or DEVICE_CREDENTIAL` is rejected by
// `BiometricPrompt.PromptInfo.Builder.build()` (rejected on 28 and 29 only).
private val API_LEVELS = intArrayOf(
  Build.VERSION_CODES.O_MR1,
  Build.VERSION_CODES.P,
  Build.VERSION_CODES.Q,
  Build.VERSION_CODES.R,
  Build.VERSION_CODES.UPSIDE_DOWN_CAKE
)

private val BIOMETRIC_UNAVAILABLE_ERRORS = intArrayOf(
  BiometricPrompt.ERROR_HW_NOT_PRESENT,
  BiometricPrompt.ERROR_HW_UNAVAILABLE,
  BiometricPrompt.ERROR_NO_BIOMETRICS,
  BiometricPrompt.ERROR_UNABLE_TO_PROCESS,
  BiometricPrompt.ERROR_NO_SPACE
)

private val DEVICE_CREDENTIAL_BUTTON_ERRORS = intArrayOf(
  BiometricPrompt.ERROR_NEGATIVE_BUTTON,
  BiometricPrompt.ERROR_LOCKOUT,
  BiometricPrompt.ERROR_LOCKOUT_PERMANENT
)

private val CANCELLATION_ERRORS = intArrayOf(
  BiometricPrompt.ERROR_USER_CANCELED,
  BiometricPrompt.ERROR_CANCELED,
  BiometricPrompt.ERROR_TIMEOUT
)

class AuthenticatorSelectionTest {
  @Test
  fun `weak biometrics with device fallback allows weak or device credential on every API level`() {
    for (apiLevel in API_LEVELS) {
      val selection = selectAuthenticators(BiometricsSecurityLevel.WEAK, disableDeviceFallback = false, apiLevel = apiLevel)
      assertEquals(Authenticators.BIOMETRIC_WEAK or Authenticators.DEVICE_CREDENTIAL, selection.allowedAuthenticators)
      assertFalse(selection.usesDeviceCredentialButton)
    }
  }

  @Test
  fun `disabling device fallback requests only the biometric class on every API level`() {
    for (apiLevel in API_LEVELS) {
      val weak = selectAuthenticators(BiometricsSecurityLevel.WEAK, disableDeviceFallback = true, apiLevel = apiLevel)
      assertEquals(Authenticators.BIOMETRIC_WEAK, weak.allowedAuthenticators)
      assertFalse(weak.usesDeviceCredentialButton)

      val strong = selectAuthenticators(BiometricsSecurityLevel.STRONG, disableDeviceFallback = true, apiLevel = apiLevel)
      assertEquals(Authenticators.BIOMETRIC_STRONG, strong.allowedAuthenticators)
      assertFalse(strong.usesDeviceCredentialButton)
    }
  }

  @Test
  fun `strong biometrics with device fallback combines both authenticators outside API 28-29`() {
    for (apiLevel in intArrayOf(Build.VERSION_CODES.O_MR1, Build.VERSION_CODES.R, Build.VERSION_CODES.UPSIDE_DOWN_CAKE)) {
      val selection = selectAuthenticators(BiometricsSecurityLevel.STRONG, disableDeviceFallback = false, apiLevel = apiLevel)
      assertEquals(Authenticators.BIOMETRIC_STRONG or Authenticators.DEVICE_CREDENTIAL, selection.allowedAuthenticators)
      assertFalse(selection.usesDeviceCredentialButton)
    }
  }

  @Test
  fun `strong biometrics with device fallback keeps strong biometrics and uses the device credential button on API 28-29`() {
    for (apiLevel in intArrayOf(Build.VERSION_CODES.P, Build.VERSION_CODES.Q)) {
      val selection = selectAuthenticators(BiometricsSecurityLevel.STRONG, disableDeviceFallback = false, apiLevel = apiLevel)
      // `BIOMETRIC_STRONG or DEVICE_CREDENTIAL` makes `PromptInfo.Builder.build()` throw on these
      // API levels, and accepting weak biometrics instead would let a Class 2 biometric pass.
      assertEquals(Authenticators.BIOMETRIC_STRONG, selection.allowedAuthenticators)
      assertTrue(selection.usesDeviceCredentialButton)
    }
  }

  @Test
  fun `unavailable biometrics fall back to the device credential when the device fallback is enabled`() {
    for (errorCode in BIOMETRIC_UNAVAILABLE_ERRORS) {
      assertTrue(shouldFallBackToDeviceCredential(errorCode, disableDeviceFallback = false, usesDeviceCredentialButton = false))
      assertTrue(shouldFallBackToDeviceCredential(errorCode, disableDeviceFallback = false, usesDeviceCredentialButton = true))
    }
  }

  @Test
  fun `no error falls back to the device credential when the device fallback is disabled`() {
    for (errorCode in BIOMETRIC_UNAVAILABLE_ERRORS + DEVICE_CREDENTIAL_BUTTON_ERRORS + CANCELLATION_ERRORS) {
      assertFalse(shouldFallBackToDeviceCredential(errorCode, disableDeviceFallback = true, usesDeviceCredentialButton = false))
    }
  }

  @Test
  fun `the device credential button and lockouts fall back to the device credential when the module offers the button`() {
    for (errorCode in DEVICE_CREDENTIAL_BUTTON_ERRORS) {
      assertTrue(shouldFallBackToDeviceCredential(errorCode, disableDeviceFallback = false, usesDeviceCredentialButton = true))
    }
  }

  @Test
  fun `the negative button and lockouts are reported as errors when the module does not offer the button`() {
    for (errorCode in DEVICE_CREDENTIAL_BUTTON_ERRORS) {
      assertFalse(shouldFallBackToDeviceCredential(errorCode, disableDeviceFallback = false, usesDeviceCredentialButton = false))
    }
  }

  @Test
  fun `cancellations never fall back to the device credential`() {
    for (errorCode in CANCELLATION_ERRORS) {
      assertFalse(shouldFallBackToDeviceCredential(errorCode, disableDeviceFallback = false, usesDeviceCredentialButton = false))
      assertFalse(shouldFallBackToDeviceCredential(errorCode, disableDeviceFallback = false, usesDeviceCredentialButton = true))
    }
  }

  @Test
  fun `the device credential button uses the fallback label or the default one`() {
    val selection = AuthenticatorSelection(Authenticators.BIOMETRIC_STRONG, usesDeviceCredentialButton = true)
    assertEquals("Use PIN", negativeButtonText(selection, disableDeviceFallback = false, cancelLabel = "Cancel", fallbackLabel = "Use PIN") { "Default" })
    assertEquals("Default", negativeButtonText(selection, disableDeviceFallback = false, cancelLabel = "Cancel", fallbackLabel = "") { "Default" })
    assertEquals("Default", negativeButtonText(selection, disableDeviceFallback = false, cancelLabel = "Cancel", fallbackLabel = null) { "Default" })
  }

  @Test
  fun `the negative button cancels when the device fallback is disabled and is hidden otherwise`() {
    val biometricOnly = AuthenticatorSelection(Authenticators.BIOMETRIC_STRONG, usesDeviceCredentialButton = false)
    assertEquals("Cancel", negativeButtonText(biometricOnly, disableDeviceFallback = true, cancelLabel = "Cancel", fallbackLabel = "Use PIN") { "Default" })

    val withDeviceCredential = AuthenticatorSelection(
      Authenticators.BIOMETRIC_STRONG or Authenticators.DEVICE_CREDENTIAL,
      usesDeviceCredentialButton = false
    )
    assertNull(negativeButtonText(withDeviceCredential, disableDeviceFallback = false, cancelLabel = "Cancel", fallbackLabel = "Use PIN") { "Default" })
  }
}
