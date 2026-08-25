package expo.modules.securestore

import expo.modules.kotlin.types.ConvertedValue
import expo.modules.kotlin.types.Either
import expo.modules.kotlin.types.IncompatibleValue
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Builds the `Either` that the argument converter would produce for a `requireAuthentication` value.
 */
private fun requireAuthenticationOf(value: Any): Either<Boolean, String> = Either(
  value,
  mutableListOf(
    if (value is Boolean) ConvertedValue(value) else IncompatibleValue,
    if (value is String) ConvertedValue(value) else IncompatibleValue
  ),
  emptyList()
)

class SecureStoreOptionsTest {
  @Test
  fun `confirmation is required by default`() {
    assertTrue(SecureStoreOptions().requireConfirmation)
  }

  @Test
  fun `write prompt uses the current authentication options`() {
    val options = SecureStoreOptions(
      requireAuthentication = requireAuthenticationOf(true),
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
      requireAuthentication = requireAuthenticationOf(true),
      requireConfirmation = false
    )

    val promptOptions = options.toAuthenticationPromptOptions(authenticationRequirement = null)

    assertFalse(promptOptions.isAuthenticationRequired)
    assertFalse(promptOptions.requireConfirmation)
  }
}
