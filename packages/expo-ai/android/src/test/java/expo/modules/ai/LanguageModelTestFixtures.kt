package expo.modules.ai

import expo.modules.kotlin.Promise

internal class TestPromise : Promise {
  val results = mutableListOf<Any?>()
  val errors = mutableListOf<String?>()
  override fun resolve(value: Any?) { results.add(value) }
  override fun reject(code: String?, message: String?, cause: Throwable?) { errors.add(code) }
}

internal class TestBackend : LanguageModelBackend {
  var currentStatus = ModelStatus.AVAILABLE
  var statusCalls = 0
  var downloads = 0
  var closes = 0
  val prompts = mutableListOf<String>()
  val instructions = mutableListOf<String?>()
  val options = mutableListOf<LanguageModelRequestOptions>()
  var response: suspend (String, (String) -> Unit) -> String = { _, _ -> "answer" }
  override suspend fun status(): ModelStatus { statusCalls++; return currentStatus }
  override suspend fun modelName() = "test-model"
  override suspend fun tokenLimit() = 4096
  override suspend fun download(onProgress: (Double?) -> Unit) {
    downloads++
    onProgress(null)
    onProgress(0.5)
    onProgress(1.0)
    currentStatus = ModelStatus.AVAILABLE
  }
  override suspend fun generate(
    prompt: String,
    instructions: String?,
    options: LanguageModelRequestOptions,
    onText: (String) -> Unit
  ): String {
    prompts.add(prompt)
    this.instructions.add(instructions)
    this.options.add(options)
    return response(prompt, onText)
  }
  override fun close() { closes++ }
}
