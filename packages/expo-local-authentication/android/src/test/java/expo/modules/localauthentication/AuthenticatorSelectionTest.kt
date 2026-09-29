package expo.modules.localauthentication

import androidx.biometric.BiometricManager.Authenticators
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

// API levels around the range where `BIOMETRIC_STRONG or DEVICE_CREDENTIAL` is rejected by
// `BiometricPrompt.PromptInfo.Builder.build()` (rejected on 28 and 29 only).
private const val API_27 = 27
private const val API_28 = 28
private const val API_29 = 29
private const val API_30 = 30
private const val API_34 = 34

class AuthenticatorSelectionTest {
  @Test
  fun `weak biometrics with device fallback allows weak or device credential on every API level`() {
    for (apiLevel in intArrayOf(API_27, API_28, API_29, API_30, API_34)) {
      val selection = selectAuthenticators(BiometricsSecurityLevel.WEAK, disableDeviceFallback = false, apiLevel = apiLevel)
      assertEquals(Authenticators.BIOMETRIC_WEAK or Authenticators.DEVICE_CREDENTIAL, selection.allowedAuthenticators)
      assertFalse(selection.fallbackToWeakUsed)
    }
  }

  @Test
  fun `disabling device fallback requests only the biometric class on every API level`() {
    for (apiLevel in intArrayOf(API_27, API_28, API_29, API_30, API_34)) {
      val weak = selectAuthenticators(BiometricsSecurityLevel.WEAK, disableDeviceFallback = true, apiLevel = apiLevel)
      assertEquals(Authenticators.BIOMETRIC_WEAK, weak.allowedAuthenticators)
      assertFalse(weak.fallbackToWeakUsed)

      val strong = selectAuthenticators(BiometricsSecurityLevel.STRONG, disableDeviceFallback = true, apiLevel = apiLevel)
      assertEquals(Authenticators.BIOMETRIC_STRONG, strong.allowedAuthenticators)
      assertFalse(strong.fallbackToWeakUsed)
    }
  }

  @Test
  fun `strong biometrics with device fallback combines both authenticators outside API 28-29`() {
    for (apiLevel in intArrayOf(API_27, API_30, API_34)) {
      val selection = selectAuthenticators(BiometricsSecurityLevel.STRONG, disableDeviceFallback = false, apiLevel = apiLevel)
      assertEquals(Authenticators.BIOMETRIC_STRONG or Authenticators.DEVICE_CREDENTIAL, selection.allowedAuthenticators)
      assertFalse(selection.fallbackToWeakUsed)
    }
  }

  @Test
  fun `strong biometrics with device fallback falls back to weak biometrics on API 28-29`() {
    for (apiLevel in intArrayOf(API_28, API_29)) {
      val selection = selectAuthenticators(BiometricsSecurityLevel.STRONG, disableDeviceFallback = false, apiLevel = apiLevel)
      // `BIOMETRIC_STRONG or DEVICE_CREDENTIAL` makes `PromptInfo.Builder.build()` throw on these
      // API levels, so the prompt must downgrade to weak biometrics and report the fallback.
      assertEquals(Authenticators.BIOMETRIC_WEAK or Authenticators.DEVICE_CREDENTIAL, selection.allowedAuthenticators)
      assertTrue(selection.fallbackToWeakUsed)
    }
  }
}
