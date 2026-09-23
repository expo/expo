package expo.modules.ai

import com.google.mlkit.genai.common.DownloadStatus
import com.google.mlkit.genai.common.FeatureStatus
import com.google.mlkit.genai.prompt.GenerateContentRequest
import com.google.mlkit.genai.prompt.Generation
import com.google.mlkit.genai.prompt.GenerativeModel
import com.google.mlkit.genai.prompt.SystemInstruction
import com.google.mlkit.genai.prompt.TextPart
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive

internal class MlKitLanguageModelBackend(
  private val model: GenerativeModel = Generation.getClient()
) : LanguageModelBackend {
  override suspend fun status() = when (model.checkStatus()) {
    FeatureStatus.AVAILABLE -> ModelStatus.AVAILABLE
    FeatureStatus.DOWNLOADABLE -> ModelStatus.DOWNLOADABLE
    FeatureStatus.DOWNLOADING -> ModelStatus.DOWNLOADING
    else -> ModelStatus.UNAVAILABLE
  }

  // Metadata failure does not make an otherwise available model unusable.
  override suspend fun modelName(): String? = optionalMetadata { model.getBaseModelName().takeIf { it.isNotBlank() } }
  override suspend fun tokenLimit(): Int? = optionalMetadata { model.getTokenLimit().takeIf { it > 0 } }

  override suspend fun download(onProgress: (Double?) -> Unit) {
    var totalBytes: Long? = null
    var completed = false
    model.download().collect { status ->
      currentCoroutineContext().ensureActive()
      when (status) {
        is DownloadStatus.DownloadStarted -> {
          totalBytes = status.bytesToDownload.takeIf { it > 0 }
          onProgress(if (totalBytes == null) null else 0.0)
        }
        is DownloadStatus.DownloadProgress -> onProgress(
          totalBytes?.let { (status.totalBytesDownloaded.toDouble() / it).coerceIn(0.0, 1.0) }
        )
        DownloadStatus.DownloadCompleted -> {
          completed = true
          onProgress(1.0)
        }
        is DownloadStatus.DownloadFailed -> throw LanguageModelException.from(status.e, "ERR_PREPARATION_FAILED")
      }
    }
    if (!completed) throw LanguageModelException("ERR_PREPARATION_FAILED", "The model download ended without completion.")
  }

  override suspend fun generate(
    prompt: String,
    instructions: String?,
    options: LanguageModelRequestOptions,
    onText: (String) -> Unit
  ): String {
    when (status()) {
      ModelStatus.AVAILABLE -> Unit
      ModelStatus.DOWNLOADABLE, ModelStatus.DOWNLOADING -> throw LanguageModelException("ERR_MODEL_NOT_READY", "Prepare the ML Kit model before generating.")
      ModelStatus.UNAVAILABLE -> throw LanguageModelException("ERR_MODEL_UNAVAILABLE", "ML Kit is not available on this device.")
    }
    val nativeInstructions = instructions != null && model.isSystemPromptAvailable()
    val input = if (instructions != null && !nativeInstructions) {
      "Instructions:\n$instructions\n\nRequest:\n$prompt"
    } else {
      prompt
    }
    val request = GenerateContentRequest.Builder(TextPart(input)).apply {
      if (nativeInstructions) systemInstruction = SystemInstruction(requireNotNull(instructions))
      options.maximumOutputTokens?.let { maxOutputTokens = it }
      candidateCount = 1
    }.build()
    if (!options.stream) {
      val result = model.generateContent(request)
      return result.candidates.firstOrNull()?.text
        ?: throw LanguageModelException("ERR_RESPONSE_INVALID", "The model returned no text candidate.")
    }
    val text = StringBuilder()
    var hasCandidate = false
    model.generateContentStream(request).collect { chunk ->
      currentCoroutineContext().ensureActive()
      chunk.candidates.firstOrNull()?.let {
        hasCandidate = true
        text.append(it.text)
        onText(text.toString())
      }
    }
    if (!hasCandidate) throw LanguageModelException("ERR_RESPONSE_INVALID", "The model returned no text candidate.")
    return text.toString()
  }

  override fun close() = model.close()

  private suspend fun <T> optionalMetadata(body: suspend () -> T?): T? = try {
    body()
  } catch (error: CancellationException) {
    throw error
  } catch (_: Exception) {
    null
  }
}
