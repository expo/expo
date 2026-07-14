package expo.modules.kotlin.jni

import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.core.interfaces.DoNotStrip
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference

@DoNotStrip
interface JSHeapAccessExecutor {
  @DoNotStrip
  fun runOnQueue(runnable: Runnable, onCancellation: Runnable): Boolean

  @DoNotStrip
  @Throws(Throwable::class)
  fun runOnQueueSync(runnable: Runnable)

  @DoNotStrip
  fun invalidate()
}

@DoNotStrip
class MainJSHeapAccessExecutor internal constructor(
  private val reactContext: ReactApplicationContext,
  private val syncTimeoutMillis: Long = DEFAULT_SYNC_TIMEOUT_MILLIS
) : JSHeapAccessExecutor {
  private val accepting = AtomicBoolean(true)
  private val admissionLock = Any()
  private val pending = ConcurrentHashMap.newKeySet<PendingTask>()

  @DoNotStrip
  override fun runOnQueue(runnable: Runnable, onCancellation: Runnable): Boolean {
    return enqueue(runnable, onCancellation) != null
  }

  @DoNotStrip
  override fun runOnQueueSync(runnable: Runnable) {
    if (reactContext.isOnJSQueueThread) {
      runnable.run()
      return
    }

    val completed = CountDownLatch(1)
    val failure = AtomicReference<Throwable?>()
    val task = enqueue(
      Runnable {
        try {
          runnable.run()
        } catch (throwable: Throwable) {
          failure.set(throwable)
        } finally {
          completed.countDown()
        }
      },
      Runnable {
        failure.compareAndSet(
          null,
          IllegalStateException("JavaScript heap work was cancelled before it could run.")
        )
        completed.countDown()
      }
    ) ?: throw IllegalStateException("Cannot schedule ArrayBuffer access on the JavaScript queue.")

    try {
      if (!completed.await(syncTimeoutMillis, TimeUnit.MILLISECONDS)) {
        if (task.cancel()) {
          throw IllegalStateException(
            "Timed out waiting for the JavaScript thread to process ArrayBuffer access. " +
              "The JS thread may be blocked or shutting down."
          )
        }
        completed.await()
      }
    } catch (exception: InterruptedException) {
      Thread.currentThread().interrupt()
      throw exception
    }
    failure.get()?.let { throw it }
  }

  override fun invalidate() {
    val queuedTasks = synchronized(admissionLock) {
      accepting.set(false)
      pending.toList()
    }
    var firstFailure: Throwable? = null
    queuedTasks.forEach { task ->
      try {
        task.cancel()
      } catch (throwable: Throwable) {
        if (firstFailure == null) {
          firstFailure = throwable
        }
      }
    }
    firstFailure?.let { throw it }
  }

  private fun enqueue(runnable: Runnable, onCancellation: Runnable): PendingTask? {
    val task = PendingTask(runnable, onCancellation)
    val accepted = synchronized(admissionLock) {
      if (!accepting.get()) {
        false
      } else {
        pending.add(task)
        accepting.get()
      }
    }
    if (!accepted) {
      onCancellation.run()
      return null
    }
    if (!accepting.get()) {
      task.cancel()
      return null
    }
    if (!reactContext.runOnJSQueueThread(task)) {
      task.cancel()
      return null
    }
    return task
  }

  private inner class PendingTask(
    private val body: Runnable,
    private val onCancellation: Runnable
  ) : Runnable {
    private val state = AtomicReference(TaskState.QUEUED)

    override fun run() {
      if (!state.compareAndSet(TaskState.QUEUED, TaskState.RUNNING)) {
        return
      }
      try {
        body.run()
      } finally {
        state.set(TaskState.FINISHED)
        pending.remove(this)
      }
    }

    fun cancel(): Boolean {
      if (!state.compareAndSet(TaskState.QUEUED, TaskState.CANCELLED)) {
        return false
      }
      pending.remove(this)
      onCancellation.run()
      return true
    }
  }

  private enum class TaskState {
    QUEUED,
    RUNNING,
    CANCELLED,
    FINISHED
  }

  private companion object {
    const val DEFAULT_SYNC_TIMEOUT_MILLIS = 5_000L
  }
}
