package expo.modules.ai

import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.LifecycleState
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import java.lang.ref.WeakReference
import java.util.concurrent.atomic.AtomicLong

class ExpoAIModule : Module() {
  internal var backendFactory: () -> LanguageModelBackend = { MlKitLanguageModelBackend() }
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
  // These Promise functions only register work. Unconfined dispatch runs registration
  // before the native call returns; all SDK work runs on `scope`. Cancellation can
  // therefore never overtake registration, and no cancellation tombstones are needed.
  private val registrationScope = CoroutineScope(SupervisorJob() + Dispatchers.Unconfined)
  private val tasks = LanguageModelTasks(scope)
  private val sessionsLock = Any()
  private val sessions = mutableListOf<WeakReference<LanguageModelSession>>()
  private val requestCounter = AtomicLong()
  @Volatile private var destroyed = false
  @Volatile private var foreground = false

  override fun definition() = ModuleDefinition {
    Name("ExpoAI")
    Events("onPreparationProgress", "onBackground")
    Constant("supportsBackgroundEvents") { true }

    OnCreate {
      foreground = (appContext.reactContext as? ReactContext)?.lifecycleState == LifecycleState.RESUMED
    }

    AsyncFunction("getAvailabilityAsync") { inputLanguages: List<String>, outputLanguage: String?, promise: Promise ->
      tasks.start("availability-${requestCounter.incrementAndGet()}", promise, "ERR_AVAILABILITY_FAILED") { request ->
        requireForeground()
        backendFactory().use { backend ->
          val result = backend.availability(inputLanguages, outputLanguage)
          request.ensureActive()
          result.toJSON()
        }
      }
    }.runOnQueue(registrationScope)

    AsyncFunction("prepareAsync") { requestId: String, allowDownload: Boolean, inputLanguages: List<String>, outputLanguage: String?, promise: Promise ->
      if (requestId.isEmpty()) throw LanguageModelException.invalid("requestId must not be empty.")
      tasks.start("prepare-$requestId", promise, "ERR_PREPARATION_FAILED") { request ->
        requireForeground()
        backendFactory().use { backend ->
          val result = backend.prepare(allowDownload, inputLanguages, outputLanguage) { progress ->
            request.emit {
              requireForeground()
              sendEvent("onPreparationProgress", mapOf("requestId" to requestId, "progress" to progress))
            }
          }
          request.ensureActive()
          result.toJSON()
        }
      }
    }.runOnQueue(registrationScope)

    Function("cancelPreparation") { requestId: String -> tasks.cancel("prepare-$requestId") }

    AsyncFunction("createSessionAsync") { optionsJSON: String, promise: Promise ->
      val options = LanguageModelSessionOptions.parse(optionsJSON)
      tasks.start(
        "session-${requestCounter.incrementAndGet()}",
        promise,
        onSuccess = { value -> register(value as LanguageModelSession) },
        onDiscard = { value -> (value as LanguageModelSession).dispose() }
      ) { request ->
        requireForeground()
        val backend = backendFactory()
        try {
          when (backend.status()) {
            ModelStatus.AVAILABLE -> Unit
            ModelStatus.DOWNLOADABLE, ModelStatus.DOWNLOADING -> throw LanguageModelException("ERR_MODEL_NOT_READY", "Prepare the ML Kit model before creating a session.")
            ModelStatus.UNAVAILABLE -> throw LanguageModelException("ERR_MODEL_UNAVAILABLE", "ML Kit is not available on this device.")
          }
          request.ensureActive()
          LanguageModelSession(appContext, backend, options, scope, ::requireForeground)
        } catch (error: Throwable) {
          backend.close()
          throw error
        }
      }
    }.runOnQueue(registrationScope)

    Class("LanguageModelSession", LanguageModelSession::class) {
      Constructor {
        throw LanguageModelException.invalid("Use createSessionAsync() to create a language model session.")
      }

      AsyncFunction("generateAsync") { session: LanguageModelSession, requestId: String, prompt: String, optionsJSON: String, promise: Promise ->
        session.generate(requestId, prompt, optionsJSON, promise)
      }.runOnQueue(registrationScope)

      Function("cancel") { session: LanguageModelSession, requestId: String -> session.cancel(requestId) }
      Function("acceptResult") { session: LanguageModelSession, requestId: String -> session.acceptResult(requestId) }
      Function("discardResult") { session: LanguageModelSession, requestId: String -> session.discardResult(requestId) }
      Function("dispose") { session: LanguageModelSession -> session.dispose() }
      Function("resolveTool") { _: LanguageModelSession, _: String, _: String?, _: String? -> false }
    }

    OnActivityEntersForeground { foreground = true }
    OnActivityEntersBackground {
      foreground = false
      // A request can be waiting on a JavaScript tool or approval with no native
      // inference running. Interrupt that phase as well as active SDK operations.
      sendEvent("onBackground", emptyMap<String, Any>())
      tasks.cancelAll(LanguageModelException.background())
      currentSessions().forEach { it.cancelForBackground() }
    }
    OnDestroy { dispose() }
  }

  private fun requireForeground() {
    if (destroyed) throw LanguageModelException.disposed()
    if (!foreground) throw LanguageModelException.background()
  }

  private fun register(session: LanguageModelSession) = synchronized(sessionsLock) {
    if (destroyed) {
      session.dispose()
      throw LanguageModelException.disposed()
    }
    sessions.removeAll { it.get() == null }
    sessions.add(WeakReference(session))
    Unit
  }

  private fun currentSessions(): List<LanguageModelSession> = synchronized(sessionsLock) {
    sessions.mapNotNull { it.get() }
  }

  private fun dispose() {
    destroyed = true
    tasks.dispose()
    currentSessions().forEach { it.dispose() }
    synchronized(sessionsLock) { sessions.clear() }
    scope.cancel()
    // Keep the registration dispatcher usable so a retained native function
    // rejects through the disposed task registry instead of leaving a promise pending.
  }
}
