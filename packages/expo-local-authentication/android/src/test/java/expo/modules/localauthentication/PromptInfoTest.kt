package expo.modules.localauthentication

import android.os.Build
import androidx.biometric.BiometricPrompt.PromptInfo
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

// `PromptInfo.Builder.build()` validates the authenticators and the negative button against the
// running API level, so these tests build real prompts on the API levels around 28-29.
@RunWith(RobolectricTestRunner::class)
class PromptInfoTest {
  @Test
  @Config(sdk = [Build.VERSION_CODES.P, Build.VERSION_CODES.Q, Build.VERSION_CODES.R])
  fun `every security level and device fallback setting builds a prompt`() {
    for (securityLevel in BiometricsSecurityLevel.entries) {
      for (disableDeviceFallback in booleanArrayOf(false, true)) {
        for (fallbackLabel in arrayOf(null, "", "Use PIN")) {
          val selection = selectAuthenticators(securityLevel, disableDeviceFallback, Build.VERSION.SDK_INT)
          PromptInfo.Builder()
            .setTitle("Authenticate")
            .setAllowedAuthenticators(selection.allowedAuthenticators)
            .apply {
              negativeButtonText(selection, disableDeviceFallback, cancelLabel = "Cancel", fallbackLabel) { "Use screen lock" }
                ?.let { setNegativeButtonText(it) }
            }
            .build()
        }
      }
    }
  }
}
