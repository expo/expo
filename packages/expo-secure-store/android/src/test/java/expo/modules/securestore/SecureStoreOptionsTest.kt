package expo.modules.securestore

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SecureStoreOptionsTest {
  @Test
  fun `confirmation is required by default`() {
    assertTrue(SecureStoreOptions().requireConfirmation)
  }

  @Test
  fun `write prompt uses the current authentication options`() {
    val options = SecureStoreOptions(
      requireAuthentication = true,
      requireConfirmation = false
    )

    val promptOptions = options.toAuthenticationPromptOptions()

    assertTrue(promptOptions.requireAuthentication)
    assertFalse(promptOptions.requireConfirmation)
  }

  @Test
  fun `read prompt uses stored authentication and current confirmation options`() {
    val options = SecureStoreOptions(
      requireAuthentication = false,
      requireConfirmation = false
    )

    val promptOptions = options.toAuthenticationPromptOptions(requireAuthentication = true)

    assertTrue(promptOptions.requireAuthentication)
    assertFalse(promptOptions.requireConfirmation)
  }

  @Test
  fun `stored unauthenticated reads remain prompt-free`() {
    val options = SecureStoreOptions(
      requireAuthentication = true,
      requireConfirmation = false
    )

    val promptOptions = options.toAuthenticationPromptOptions(requireAuthentication = false)

    assertFalse(promptOptions.requireAuthentication)
    assertFalse(promptOptions.requireConfirmation)
  }
}
