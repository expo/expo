package expo.modules.securestore

import android.content.Context
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class AuthenticationPromptTest {
  private val context: Context
    get() = RuntimeEnvironment.getApplication()

  @Test
  fun `requires confirmation by default`() {
    val promptInfo = buildAuthenticationPromptInfo(context, "Authenticate")

    assertTrue(promptInfo.isConfirmationRequired)
  }

  @Test
  fun `can explicitly require confirmation`() {
    val promptInfo = buildAuthenticationPromptInfo(
      context,
      "Authenticate",
      requireConfirmation = true
    )

    assertTrue(promptInfo.isConfirmationRequired)
  }

  @Test
  fun `can explicitly allow implicit authentication`() {
    val promptInfo = buildAuthenticationPromptInfo(
      context,
      "Authenticate",
      requireConfirmation = false
    )

    assertFalse(promptInfo.isConfirmationRequired)
  }
}
