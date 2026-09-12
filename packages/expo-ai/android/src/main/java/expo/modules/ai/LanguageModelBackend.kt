package expo.modules.ai

import org.json.JSONArray
import org.json.JSONObject

internal enum class ModelStatus { AVAILABLE, DOWNLOADABLE, DOWNLOADING, UNAVAILABLE }

internal data class ModelAvailability(
  val status: String,
  val reason: String? = null,
  val model: String? = null,
  val contextTokens: Int? = null
) {
  fun toJSON(): String = JSONObject().apply {
    put("status", status)
    reason?.let { put("reason", it) }
    if (status != "available" && status != "unavailable") put("progress", JSONObject.NULL)
    put("capabilities", JSONObject().apply {
      put("provider", "google-mlkit")
      put("model", model ?: JSONObject.NULL)
      put("execution", "on-device")
      put("constrainedOutput", "unsupported")
      put("runtimeToolDeclarations", "unsupported")
      put("images", "unsupported")
      put("contextTokens", contextTokens ?: JSONObject.NULL)
    })
  }.toString()
}

internal data class LanguageModelTurn(val prompt: String, val response: String)

/** The SDK has no public chat role field. Keep successful turns as explicit prompt context. */
internal fun conversationPrompt(history: List<LanguageModelTurn>, prompt: String): String {
  if (history.isEmpty()) return prompt
  val turns = JSONArray()
  history.forEach { turns.put(JSONObject().put("user", it.prompt).put("assistant", it.response)) }
  return "Previous successful exchanges (JSON data):\n$turns\n\nCurrent request:\n$prompt"
}

/** Internal seam for native regression tests. It is never exposed as a JavaScript provider. */
internal interface LanguageModelBackend : AutoCloseable {
  suspend fun status(): ModelStatus
  suspend fun modelName(): String?
  suspend fun tokenLimit(): Int?
  suspend fun download(onProgress: (Double?) -> Unit)
  suspend fun generate(
    prompt: String,
    instructions: String?,
    options: LanguageModelRequestOptions,
    onText: (String) -> Unit
  ): String
}

internal suspend fun LanguageModelBackend.availability(
  inputLanguages: List<String>,
  outputLanguage: String?
): ModelAvailability {
  // Prompt API has no public supported-locale query. Requirements must not be silently ignored.
  if (inputLanguages.isNotEmpty() || outputLanguage != null) {
    return ModelAvailability("unavailable", "language-support-unknown")
  }
  return when (status()) {
    ModelStatus.AVAILABLE -> ModelAvailability("available", model = modelName(), contextTokens = tokenLimit())
    ModelStatus.DOWNLOADABLE -> ModelAvailability("downloadable")
    ModelStatus.DOWNLOADING -> ModelAvailability("downloading")
    // UNAVAILABLE also includes a device whose AICore configuration is not initialized.
    ModelStatus.UNAVAILABLE -> ModelAvailability("unavailable", "model-unavailable")
  }
}

internal suspend fun LanguageModelBackend.prepare(
  allowDownload: Boolean,
  inputLanguages: List<String>,
  outputLanguage: String?,
  onProgress: (Double?) -> Unit
): ModelAvailability {
  val current = availability(inputLanguages, outputLanguage)
  if (!allowDownload || current.status !in setOf("downloadable", "downloading")) return current
  download(onProgress)
  return availability(inputLanguages, outputLanguage)
}
