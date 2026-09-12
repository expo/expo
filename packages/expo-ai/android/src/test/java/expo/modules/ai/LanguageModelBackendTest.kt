package expo.modules.ai

import com.google.mlkit.genai.common.GenAiException
import kotlinx.coroutines.test.runTest
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

class LanguageModelBackendTest {
  @Test
  fun `generation result preserves unknown token usage`() {
    val value = JSONObject(generationResult("answer"))
    assertEquals("answer", value.getString("text"))
    val usage = value.getJSONObject("usage")
    assertTrue(usage.isNull("inputTokens"))
    assertTrue(usage.isNull("outputTokens"))
  }

  @Test
  fun `availability distinguishes readiness without downloads`() = runTest {
    val backend = TestBackend()
    val expected = mapOf(
      ModelStatus.AVAILABLE to "available",
      ModelStatus.DOWNLOADABLE to "downloadable",
      ModelStatus.DOWNLOADING to "downloading",
      ModelStatus.UNAVAILABLE to "unavailable"
    )
    expected.forEach { (status, name) ->
      backend.currentStatus = status
      val value = JSONObject(backend.availability(emptyList(), null).toJSON())
      assertEquals(name, value.getString("status"))
      val capabilities = value.getJSONObject("capabilities")
      assertEquals("google-mlkit", capabilities.getString("provider"))
      assertEquals("on-device", capabilities.getString("execution"))
      listOf("constrainedOutput", "runtimeToolDeclarations", "images").forEach {
        assertEquals("unsupported", capabilities.getString(it))
      }
      if (status == ModelStatus.AVAILABLE) {
        assertEquals("test-model", capabilities.getString("model"))
        assertEquals(4096, capabilities.getInt("contextTokens"))
      } else {
        assertTrue(capabilities.isNull("model"))
        assertTrue(capabilities.isNull("contextTokens"))
      }
      if (status in setOf(ModelStatus.DOWNLOADING, ModelStatus.DOWNLOADABLE)) assertTrue(value.isNull("progress"))
    }
    assertEquals(0, backend.downloads)
  }

  @Test
  fun `language requirements report unknown support without starting preparation`() = runTest {
    val backend = TestBackend().apply { currentStatus = ModelStatus.DOWNLOADABLE }
    for ((input, output) in listOf(listOf("en-US") to null, emptyList<String>() to "nb-NO")) {
      val value = backend.prepare(true, input, output) { fail("Unexpected progress") }
      assertEquals("unavailable", value.status)
      assertEquals("language-support-unknown", value.reason)
    }
    assertEquals(0, backend.statusCalls)
    assertEquals(0, backend.downloads)
  }

  @Test
  fun `preparation never downloads without explicit permission`() = runTest {
    for (status in ModelStatus.entries) {
      val backend = TestBackend().apply { currentStatus = status }
      backend.prepare(false, emptyList(), null) { fail("Unexpected progress") }
      assertEquals(0, backend.downloads)
    }
  }

  @Test
  fun `explicit preparation starts or joins downloads and returns fresh readiness`() = runTest {
    for (status in listOf(ModelStatus.DOWNLOADABLE, ModelStatus.DOWNLOADING)) {
      val backend = TestBackend().apply { currentStatus = status }
      val progress = mutableListOf<Double?>()
      val result = backend.prepare(true, emptyList(), null) { progress.add(it) }
      assertEquals("available", result.status)
      assertEquals(1, backend.downloads)
      assertEquals(listOf(null, 0.5, 1.0), progress)
    }
  }

  @Test
  fun `preparing an available or unavailable model never downloads`() = runTest {
    for (status in listOf(ModelStatus.AVAILABLE, ModelStatus.UNAVAILABLE)) {
      val backend = TestBackend().apply { currentStatus = status }
      backend.prepare(true, emptyList(), null) { fail("Unexpected progress") }
      assertEquals(0, backend.downloads)
    }
  }

  @Test
  fun `native schema and tools cannot silently degrade`() {
    assertCode("ERR_SCHEMA_UNSUPPORTED") { LanguageModelRequestOptions.parse("""{"schema":{"type":"string"}}""") }
    assertCode("ERR_UNSUPPORTED_FEATURE") { LanguageModelSessionOptions.parse("""{"tools":[{"name":"test"}]}""") }
    assertEquals("Write briefly.", LanguageModelSessionOptions.parse("""{"instructions":"Write briefly.","tools":[]}""").instructions)
  }

  @Test
  fun `request arguments reject invalid and overflowing token limits`() {
    for (value in listOf("0", "-1", "1.5", "2147483648", "null", "true", "\"20\"")) {
      assertCode("ERR_INVALID_ARGUMENT") { LanguageModelRequestOptions.parse("{\"maximumOutputTokens\":$value}") }
    }
    assertCode("ERR_INVALID_ARGUMENT") { LanguageModelRequestOptions.parse("""{"stream":"yes"}""") }
    assertCode("ERR_INVALID_ARGUMENT") { LanguageModelRequestOptions.parse("""{"maximumToolCalls":17}""") }
    assertCode("ERR_INVALID_ARGUMENT") { LanguageModelRequestOptions.parse("""{"unexpected":true}""") }
    assertEquals(128, LanguageModelRequestOptions.parse("""{"maximumOutputTokens":128}""").maximumOutputTokens)
  }

  @Test
  fun `SDK failures keep actionable public error codes`() {
    val cases = mapOf(
      GenAiException.ErrorCode.CANCELLED to "ERR_REQUEST_CANCELLED",
      GenAiException.ErrorCode.NOT_AVAILABLE to "ERR_MODEL_UNAVAILABLE",
      GenAiException.ErrorCode.BUSY to "ERR_RATE_LIMITED",
      GenAiException.ErrorCode.PER_APP_BATTERY_USE_QUOTA_EXCEEDED to "ERR_RATE_LIMITED",
      GenAiException.ErrorCode.REQUEST_TOO_LARGE to "ERR_CONTEXT_WINDOW_EXCEEDED",
      GenAiException.ErrorCode.BACKGROUND_USE_BLOCKED to "ERR_APP_BACKGROUND",
      GenAiException.ErrorCode.NOT_SUPPORTED to "ERR_UNSUPPORTED_FEATURE",
      GenAiException.ErrorCode.RESPONSE_PROCESSING_ERROR to "ERR_RESPONSE_INVALID"
    )
    cases.forEach { (sdkCode, code) ->
      assertEquals(code, LanguageModelException.from(GenAiException("test", null, sdkCode)).code)
    }
    assertEquals("ERR_PREPARATION_FAILED", LanguageModelException.from(IllegalStateException("download"), "ERR_PREPARATION_FAILED").code)
  }

  private fun assertCode(code: String, action: () -> Unit) {
    try {
      action()
      fail("Expected $code")
    } catch (error: LanguageModelException) {
      assertEquals(code, error.code)
    }
  }
}
