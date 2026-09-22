package expo.modules.ai

import kotlinx.coroutines.test.runTest
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

class UnsupportedOsLanguageModelBackendTest {
  @Test
  fun `ML Kit needs Android 8 and rejects every older release`() {
    assertTrue(mlKitRequiresNewerOs(24))
    assertTrue(mlKitRequiresNewerOs(25))
    assertFalse(mlKitRequiresNewerOs(26))
    assertFalse(mlKitRequiresNewerOs(35))
  }

  @Test
  fun `an older OS selects the backend that never loads ML Kit`() {
    assertSame(UnsupportedOsLanguageModelBackend, defaultLanguageModelBackend(24))
  }

  @Test
  fun `a supported OS returns the ML Kit backend`() {
    for (osVersion in listOf(26, 35)) {
      val mlKit = TestBackend()
      var constructions = 0
      val backend = defaultLanguageModelBackend(osVersion) {
        constructions++
        mlKit
      }
      assertSame(mlKit, backend)
      assertNotSame(UnsupportedOsLanguageModelBackend, backend)
      assertEquals(1, constructions)
    }
  }

  @Test
  fun `an older OS never constructs the ML Kit backend`() {
    for (osVersion in listOf(24, 25)) {
      assertSame(UnsupportedOsLanguageModelBackend, defaultLanguageModelBackend(osVersion, mlKitMustNotBeConstructed))
    }
  }

  @Test
  fun `the unavailable session message explains an unsupported OS`() {
    val message = unavailableSessionMessage(UnsupportedOsLanguageModelBackend)
    assertTrue(message.contains("Android 8.0"))
    assertTrue(message.contains("API level 26"))
    assertFalse(message.contains("unsupported-os-version"))
  }

  @Test
  fun `the unavailable session message falls back to ML Kit prose`() {
    assertEquals("ML Kit is not available on this device.", unavailableSessionMessage(TestBackend()))
  }

  @Test
  fun `an older OS outranks unknown language support as the unavailable reason`() = runTest {
    for (inputLanguages in listOf(emptyList(), listOf("en"))) {
      val availability = UnsupportedOsLanguageModelBackend.availability(inputLanguages, null)
      assertEquals("unavailable", availability.status)
      assertEquals("unsupported-os-version", availability.reason)
    }
  }

  @Test
  fun `the emitted JSON carries the unsupported OS reason to JavaScript`() = runTest {
    val value = JSONObject(UnsupportedOsLanguageModelBackend.availability(emptyList(), null).toJSON())
    assertEquals("unavailable", value.getString("status"))
    assertEquals("unsupported-os-version", value.getString("reason"))
  }

  @Test
  fun `downloading and generating reject as unavailable`() = runTest {
    assertCode("ERR_MODEL_UNAVAILABLE") {
      UnsupportedOsLanguageModelBackend.download { fail("Unexpected progress") }
    }
    assertCode("ERR_MODEL_UNAVAILABLE") {
      val options = LanguageModelRequestOptions(stream = false, maximumOutputTokens = null)
      UnsupportedOsLanguageModelBackend.generate("Hello.", null, options) { fail("Unexpected text") }
    }
  }

  @Test
  fun `the backend reports no metadata and closes without failing`() = runTest {
    UnsupportedOsLanguageModelBackend.use { backend ->
      assertEquals(ModelStatus.UNAVAILABLE, backend.status())
      assertNull(backend.modelName())
      assertNull(backend.tokenLimit())
    }
    UnsupportedOsLanguageModelBackend.close()
  }

  @Test
  fun `the unavailable message is prose and never leaks the reason code`() {
    val message = UnsupportedOsLanguageModelBackend.unavailableMessage
    assertNotNull(message)
    assertTrue(message!!.contains("Android 8.0"))
    assertTrue(message.contains("API level 26"))
    assertFalse(message.contains(UnsupportedOsLanguageModelBackend.unavailableReason!!))
  }

  @Test
  fun `the thrown message matches the reported one`() = runTest {
    try {
      UnsupportedOsLanguageModelBackend.download { fail("Unexpected progress") }
      fail("Expected ERR_MODEL_UNAVAILABLE")
    } catch (error: LanguageModelException) {
      assertEquals(UnsupportedOsLanguageModelBackend.unavailableMessage, error.message)
    }
  }

  // JUnit's fail() returns Unit, so it cannot be the body of a `() -> LanguageModelBackend`.
  // Throwing the same AssertionError fails the test identically if the supplier ever runs.
  private val mlKitMustNotBeConstructed: () -> LanguageModelBackend = {
    throw AssertionError("ML Kit was constructed on an OS older than API 26")
  }

  private suspend fun assertCode(code: String, action: suspend () -> Unit) {
    try {
      action()
      fail("Expected $code")
    } catch (error: LanguageModelException) {
      assertEquals(code, error.code)
    }
  }
}
