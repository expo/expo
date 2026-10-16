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
      requireAuthentication = AUTHENTICATION_METHOD_BIOMETRY,
      requireConfirmation = false
    )

    val promptOptions = options.toAuthenticationPromptOptions()

    assertTrue(promptOptions.isAuthenticationRequired)
    assertFalse(promptOptions.requireConfirmation)
  }

  @Test
  fun `read prompt uses stored authentication and current confirmation options`() {
    val options = SecureStoreOptions(requireConfirmation = false)

    val promptOptions = options.toAuthenticationPromptOptions(
      authenticationRequirement = AUTHENTICATION_METHOD_BIOMETRY
    )

    assertTrue(promptOptions.isAuthenticationRequired)
    assertFalse(promptOptions.requireConfirmation)
  }

  @Test
  fun `stored unauthenticated reads remain prompt-free`() {
    val options = SecureStoreOptions(
      requireAuthentication = AUTHENTICATION_METHOD_BIOMETRY,
      requireConfirmation = false
    )

    val promptOptions = options.toAuthenticationPromptOptions(authenticationRequirement = null)

    assertFalse(promptOptions.isAuthenticationRequired)
    assertFalse(promptOptions.requireConfirmation)
  }
}
