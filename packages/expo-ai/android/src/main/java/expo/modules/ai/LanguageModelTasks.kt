package expo.modules.ai

import expo.modules.kotlin.Promise
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

/** Registers synchronously, runs SDK work on a worker, and settles each promise exactly once. */
internal class LanguageModelTasks(private val scope: CoroutineScope, private val singleRequest: Boolean = false) {
  private val lock = Any()
  private val requests = mutableMapOf<String, Request>()
  private var disposed = false

  /** Serializes session receipts and history with task settlement and cancellation. */
  internal fun <T> withLock(body: () -> T): T = synchronized(lock, body)

  internal inner class Request internal constructor(val id: String, private val promise: Promise) {
    internal var job: Job? = null
    internal var failure: LanguageModelException? = null
    internal var settled = false

    fun ensureActive() = synchronized(lock) {
      failure?.let { throw it }
      if (settled || disposed) throw LanguageModelException.disposed()
    }

    fun emit(body: () -> Unit) = synchronized(lock) {
      ensureActive()
      body()
    }

    internal fun reject(error: LanguageModelException) {
      if (settled) return
      failure = error
      settled = true
      promise.reject(error)
    }

    internal fun resolve(result: Any?, onSuccess: (Any?) -> Unit, onDiscard: (Any?) -> Unit) {
      if (settled || disposed) {
        onDiscard(result)
      } else {
        onSuccess(result)
        settled = true
        // A promise continuation can immediately start the next session turn.
        // SDK work has returned, so release the busy guard before publishing it.
        requests.remove(id, this)
        promise.resolve(result)
      }
    }
  }

  fun start(
    id: String,
    promise: Promise,
    fallback: String = "ERR_GENERATION_FAILED",
    onSuccess: (Any?) -> Unit = {},
    onDiscard: (Any?) -> Unit = {},
    body: suspend (Request) -> Any?
  ) {
    val request = synchronized(lock) {
      if (disposed) throw LanguageModelException.disposed()
      if (id.isEmpty()) throw LanguageModelException.invalid("requestId must not be empty.")
      if (requests.containsKey(id) || (singleRequest && requests.isNotEmpty())) {
        throw LanguageModelException("ERR_SESSION_BUSY", "A language model request is already running.")
      }
      Request(id, promise).also { requests[id] = it }
    }
    val job = scope.launch(start = CoroutineStart.LAZY) {
      try {
        request.ensureActive()
        val result = body(request)
        synchronized(lock) { request.resolve(result, onSuccess, onDiscard) }
      } catch (error: Throwable) {
        synchronized(lock) {
          requests.remove(id, request)
          request.reject(LanguageModelException.from(error, fallback))
        }
      }
    }
    synchronized(lock) {
      request.job = job
      if (request.settled) job.cancel()
    }
    // A lazy job can be cancelled before its body starts, so cleanup belongs here.
    job.invokeOnCompletion {
      synchronized(lock) {
        if (!request.settled) request.reject(LanguageModelException.cancelled())
        requests.remove(id, request)
      }
    }
    job.start()
  }

  fun cancel(id: String) = synchronized(lock) {
    requests[id]?.let {
      it.reject(LanguageModelException.cancelled())
      it.job?.cancel()
    }
    Unit
  }

  fun cancelAll(error: LanguageModelException) = synchronized(lock) {
    requests.values.toList().forEach {
      it.reject(error)
      it.job?.cancel()
    }
  }

  fun dispose() = synchronized(lock) {
    disposed = true
    cancelAll(LanguageModelException.disposed())
  }

  internal val activeCount: Int get() = synchronized(lock) { requests.size }
}
