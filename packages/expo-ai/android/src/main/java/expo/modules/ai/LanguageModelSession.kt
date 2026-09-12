package expo.modules.ai

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.sharedobjects.SharedObject
import kotlinx.coroutines.CoroutineScope
import java.util.concurrent.atomic.AtomicBoolean

internal class LanguageModelSession(
  appContext: AppContext,
  private val backend: LanguageModelBackend,
  options: LanguageModelSessionOptions,
  scope: CoroutineScope,
  requireForeground: () -> Unit
) : SharedObject(appContext) {
  private val controller = LanguageModelSessionController(backend, options, scope, requireForeground) { requestId, text ->
    emit("onText", mapOf("requestId" to requestId, "text" to text))
  }

  fun generate(requestId: String, prompt: String, optionsJSON: String, promise: Promise) =
    controller.generate(requestId, prompt, optionsJSON, promise)

  fun cancel(requestId: String) = controller.cancel(requestId)
  fun acceptResult(requestId: String) = controller.acceptResult(requestId)
  fun discardResult(requestId: String) = controller.discardResult(requestId)
  fun cancelForBackground() = controller.cancelForBackground()
  fun dispose() = controller.dispose()
  override fun sharedObjectDidRelease() = dispose()
}

/** Keeps history and cancellation testable without creating a JavaScript runtime. */
internal class LanguageModelSessionController(
  private val backend: LanguageModelBackend,
  private val options: LanguageModelSessionOptions,
  scope: CoroutineScope,
  private val requireForeground: () -> Unit,
  private val onText: (String, String) -> Unit
) {
  private val tasks = LanguageModelTasks(scope, singleRequest = true)
  private val history = mutableListOf<LanguageModelTurn>()
  private val closed = AtomicBoolean(false)
  private data class PendingResult(val requestId: String, val turn: LanguageModelTurn)
  private var pendingResult: PendingResult? = null

  fun generate(requestId: String, prompt: String, optionsJSON: String, promise: Promise) {
    val requestOptions = LanguageModelRequestOptions.parse(optionsJSON)
    tasks.withLock {
      if (pendingResult != null) {
        throw LanguageModelException("ERR_SESSION_BUSY", "The previous result is awaiting acceptance.")
      }
      val previousTurns = history.toList()
      tasks.start(requestId, promise, onSuccess = { response ->
        // Promise delivery can precede cancellation or JavaScript validation.
        // Only an explicit acceptance may add this turn to the conversation.
        pendingResult = PendingResult(requestId, LanguageModelTurn(prompt, response as String))
      }) { request ->
        requireForeground()
        val input = conversationPrompt(previousTurns, prompt)
        val text = backend.generate(input, options.instructions, requestOptions) { snapshot ->
          request.emit {
            requireForeground()
            onText(requestId, snapshot)
          }
        }
        request.ensureActive()
        requireForeground()
        text
      }
    }
  }

  fun acceptResult(requestId: String): Boolean = tasks.withLock {
    val pending = pendingResult
    if (closed.get() || pending?.requestId != requestId) return@withLock false
    try {
      requireForeground()
    } catch (_: LanguageModelException) {
      pendingResult = null
      return@withLock false
    }
    history.add(pending.turn)
    pendingResult = null
    true
  }

  fun discardResult(requestId: String) = tasks.withLock {
    if (pendingResult?.requestId == requestId) pendingResult = null
    // Reject active work as well, so an in-flight completion cannot stage later.
    tasks.cancel(requestId)
  }

  fun cancel(requestId: String) = discardResult(requestId)

  fun cancelForBackground() = tasks.withLock {
    pendingResult = null
    tasks.cancelAll(LanguageModelException.background())
  }

  fun dispose() {
    val shouldClose = tasks.withLock {
      pendingResult = null
      history.clear()
      tasks.dispose()
      closed.compareAndSet(false, true)
    }
    if (shouldClose) backend.close()
  }
}
