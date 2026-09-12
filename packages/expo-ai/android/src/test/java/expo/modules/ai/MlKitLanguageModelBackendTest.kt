package expo.modules.ai

import com.google.mlkit.genai.common.DownloadStatus
import com.google.mlkit.genai.common.FeatureStatus
import com.google.mlkit.genai.common.GenAiException
import com.google.mlkit.genai.prompt.Candidate
import com.google.mlkit.genai.prompt.GenerateContentRequest
import com.google.mlkit.genai.prompt.GenerateContentResponse
import com.google.mlkit.genai.prompt.GenerativeModel
import com.google.mlkit.genai.prompt.TextPart
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Test

class MlKitLanguageModelBackendTest {
  private fun response(text: String): GenerateContentResponse {
    val candidate = mockk<Candidate>()
    every { candidate.text } returns text
    return mockk<GenerateContentResponse>().also { response ->
      every { response.candidates } returns listOf(candidate)
    }
  }

  @Test
  fun `streamed SDK chunks become cumulative public snapshots`() = runTest {
    val model = mockk<GenerativeModel>()
    coEvery { model.checkStatus() } returns FeatureStatus.AVAILABLE
    every { model.generateContentStream(any<GenerateContentRequest>()) } returns flowOf(response("Hello"), response(" world"))
    val updates = mutableListOf<String>()
    val backend = MlKitLanguageModelBackend(model)
    val result = backend.generate("Greet", null, LanguageModelRequestOptions(true, null)) { updates.add(it) }
    assertEquals("Hello world", result)
    assertEquals(listOf("Hello", "Hello world"), updates)
  }

  @Test
  fun `instructions use native system prompts when the model supports them`() = runTest {
    val model = mockk<GenerativeModel>()
    coEvery { model.checkStatus() } returns FeatureStatus.AVAILABLE
    coEvery { model.isSystemPromptAvailable() } returns true
    val request = slot<GenerateContentRequest>()
    coEvery { model.generateContent(capture(request)) } returns response("answer")
    MlKitLanguageModelBackend(model).generate("Task", "Be concise", LanguageModelRequestOptions(false, 123)) {}
    assertEquals("Be concise", request.captured.systemInstruction?.textString)
    assertEquals(123, request.captured.maxOutputTokens)
    assertEquals("Task", (request.captured.contents.first().parts.first() as TextPart).textString)
  }

  @Test
  fun `models without system prompts receive instructions as explicit prompt text`() = runTest {
    val model = mockk<GenerativeModel>()
    coEvery { model.checkStatus() } returns FeatureStatus.AVAILABLE
    coEvery { model.isSystemPromptAvailable() } returns false
    val request = slot<GenerateContentRequest>()
    coEvery { model.generateContent(capture(request)) } returns response("answer")
    MlKitLanguageModelBackend(model).generate("Task", "Be concise", LanguageModelRequestOptions(false, null)) {}
    assertNull(request.captured.systemInstruction)
    assertEquals("Instructions:\nBe concise\n\nRequest:\nTask", (request.captured.contents.first().parts.first() as TextPart).textString)
  }

  @Test
  fun `generation checks readiness and never starts downloads`() = runTest {
    for (status in listOf(FeatureStatus.DOWNLOADABLE, FeatureStatus.DOWNLOADING, FeatureStatus.UNAVAILABLE)) {
      val model = mockk<GenerativeModel>()
      coEvery { model.checkStatus() } returns status
      try {
        MlKitLanguageModelBackend(model).generate("Task", null, LanguageModelRequestOptions(false, null)) {}
        fail("Unavailable models must reject generation")
      } catch (error: LanguageModelException) {
        assertEquals(if (status == FeatureStatus.UNAVAILABLE) "ERR_MODEL_UNAVAILABLE" else "ERR_MODEL_NOT_READY", error.code)
      }
      coVerify(exactly = 0) { model.generateContent(any<GenerateContentRequest>()) }
      coVerify(exactly = 0) { model.download() }
    }
  }

  @Test
  fun `download progress uses actual byte totals and preserves unknown size`() = runTest {
    val model = mockk<GenerativeModel>()
    every { model.download() } returns flowOf(
      DownloadStatus.DownloadStarted(0),
      DownloadStatus.DownloadProgress(5),
      DownloadStatus.DownloadStarted(100),
      DownloadStatus.DownloadProgress(50),
      DownloadStatus.DownloadProgress(150),
      DownloadStatus.DownloadCompleted
    )
    val progress = mutableListOf<Double?>()
    MlKitLanguageModelBackend(model).download { progress.add(it) }
    assertEquals(listOf(null, null, 0.0, 0.5, 1.0, 1.0), progress)
  }

  @Test
  fun `failed and prematurely ended downloads do not report success`() = runTest {
    val model = mockk<GenerativeModel>()
    every { model.download() } returns flowOf(DownloadStatus.DownloadStarted(100))
    try {
      MlKitLanguageModelBackend(model).download {}
      fail("A truncated download must fail")
    } catch (error: LanguageModelException) {
      assertEquals("ERR_PREPARATION_FAILED", error.code)
    }
    every { model.download() } returns flowOf(DownloadStatus.DownloadFailed(GenAiException("disk full", null, GenAiException.ErrorCode.NOT_ENOUGH_DISK_SPACE)))
    try {
      MlKitLanguageModelBackend(model).download {}
      fail("A failed download must fail")
    } catch (error: LanguageModelException) {
      assertEquals("ERR_PREPARATION_FAILED", error.code)
    }
  }

  @Test
  fun `missing metadata remains unknown but cancellation is not swallowed`() = runTest {
    val model = mockk<GenerativeModel>()
    coEvery { model.getBaseModelName() } throws IllegalStateException("no metadata")
    coEvery { model.getTokenLimit() } returns 0
    val backend = MlKitLanguageModelBackend(model)
    assertNull(backend.modelName())
    assertNull(backend.tokenLimit())
    coEvery { model.getBaseModelName() } throws CancellationException("cancelled")
    try {
      backend.modelName()
      fail("Cancellation must propagate")
    } catch (_: CancellationException) {
      // Expected.
    }
  }
}
