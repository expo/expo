package expo.modules.kotlin.jni

import java.util.concurrent.CountDownLatch
import java.util.concurrent.LinkedBlockingDeque
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicReference

internal class ControllableJSHeapAccessExecutor private constructor(
  private val mode: Mode,
  private val lifecycleHooks: LifecycleHooks
) : JSHeapAccessExecutor, AutoCloseable {
  private val tasks = LinkedBlockingDeque<Task>()
  private val acceptingWork = AtomicBoolean(true)
  private val admissionLock = Any()
  private val closed = AtomicBoolean(false)
  private val executedTasks = AtomicInteger(0)
  private val worker = if (mode == Mode.DEDICATED_THREAD) {
    Thread(::drainOnDedicatedThread, "ControllableJSHeapAccessExecutor").apply {
      isDaemon = true
      start()
    }
  } else {
    null
  }

  val executedTaskCount: Int
    get() = executedTasks.get()

  override fun runOnQueue(runnable: Runnable, onCancellation: Runnable): Boolean {
    val task = enqueue(runnable, onCancellation) ?: return false
    if (mode == Mode.SAME_THREAD) {
      lifecycleHooks.beforeSameThreadExecution()
      tasks.remove(task)
      execute(task)
    }
    return true
  }

  override fun runOnQueueSync(runnable: Runnable) {
    if (Thread.currentThread() === worker) {
      executedTasks.incrementAndGet()
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
    ) ?: throw IllegalStateException("Cannot schedule work after the executor has been invalidated.")

    if (mode == Mode.SAME_THREAD) {
      lifecycleHooks.beforeSameThreadExecution()
      tasks.remove(task)
      execute(task)
    }

    try {
      completed.await()
    } catch (exception: InterruptedException) {
      Thread.currentThread().interrupt()
      throw exception
    }

    failure.get()?.let { throw it }
  }

  fun runNext(): Boolean {
    val task = tasks.pollFirst() ?: return false
    execute(task)
    return true
  }

  fun runLast(): Boolean {
    val task = tasks.pollLast() ?: return false
    execute(task)
    return true
  }

  fun runAll(): Int {
    var count = 0
    while (runNext()) {
      count++
    }
    return count
  }

  fun rejectNewWork() {
    synchronized(admissionLock) {
      acceptingWork.set(false)
    }
  }

  fun dropAcceptedWork() {
    var firstFailure: Throwable? = null
    while (true) {
      val task = tasks.pollFirst() ?: break
      try {
        task.cancel()
      } catch (throwable: Throwable) {
        if (firstFailure == null) {
          firstFailure = throwable
        } else {
          firstFailure.addSuppressed(throwable)
        }
      }
    }
    firstFailure?.let { throw it }
  }

  override fun invalidate() {
    rejectNewWork()
    dropAcceptedWork()
  }

  override fun close() {
    if (!closed.compareAndSet(false, true)) {
      return
    }
    var failure: Throwable? = null
    try {
      invalidate()
    } catch (throwable: Throwable) {
      failure = throwable
    }
    worker?.let { worker ->
      worker.interrupt()
      if (worker !== Thread.currentThread()) {
        worker.join()
      }
    }
    failure?.let { throw it }
  }

  private fun enqueue(runnable: Runnable, onCancellation: Runnable): Task? {
    val task = Task(runnable, onCancellation)
    val accepted = synchronized(admissionLock) {
      if (!acceptingWork.get()) {
        false
      } else {
        tasks.addLast(task)
        lifecycleHooks.afterTaskQueued()
        true
      }
    }
    if (!accepted) {
      onCancellation.run()
      return null
    }
    return task
  }

  private fun execute(task: Task) {
    if (!task.start()) {
      return
    }
    try {
      executedTasks.incrementAndGet()
      task.run()
    } finally {
      task.finish()
    }
  }

  private fun drainOnDedicatedThread() {
    while (!closed.get()) {
      try {
        tasks.pollFirst(100, TimeUnit.MILLISECONDS)?.let { task ->
          try {
            execute(task)
          } catch (_: Throwable) {
            // Keep draining later accepted work after an asynchronous task fails.
          }
        }
      } catch (_: InterruptedException) {
        if (closed.get()) {
          return
        }
      }
    }
  }

  private inner class Task(
    private val runnable: Runnable,
    private val onCancellation: Runnable
  ) {
    private val state = AtomicReference(TaskState.QUEUED)

    fun start(): Boolean = state.compareAndSet(TaskState.QUEUED, TaskState.RUNNING)

    fun run() {
      runnable.run()
    }

    fun finish() {
      state.set(TaskState.FINISHED)
    }

    fun cancel(): Boolean {
      if (!state.compareAndSet(TaskState.QUEUED, TaskState.CANCELLED)) {
        return false
      }
      tasks.remove(this)
      var firstFailure: Throwable? = null
      try {
        lifecycleHooks.beforeTaskCancellation()
      } catch (throwable: Throwable) {
        firstFailure = throwable
      }
      try {
        onCancellation.run()
      } catch (throwable: Throwable) {
        if (firstFailure == null) {
          firstFailure = throwable
        } else {
          firstFailure.addSuppressed(throwable)
        }
      }
      firstFailure?.let { throw it }
      return true
    }
  }

  private enum class Mode {
    SAME_THREAD,
    DEDICATED_THREAD,
    MANUAL
  }

  private enum class TaskState {
    QUEUED,
    RUNNING,
    CANCELLED,
    FINISHED
  }

  internal class LifecycleHooks(
    val afterTaskQueued: () -> Unit = {},
    val beforeSameThreadExecution: () -> Unit = {},
    val beforeTaskCancellation: () -> Unit = {}
  )

  companion object {
    fun sameThread(lifecycleHooks: LifecycleHooks = LifecycleHooks()) =
      ControllableJSHeapAccessExecutor(Mode.SAME_THREAD, lifecycleHooks)

    fun dedicatedThread(lifecycleHooks: LifecycleHooks = LifecycleHooks()) =
      ControllableJSHeapAccessExecutor(Mode.DEDICATED_THREAD, lifecycleHooks)

    fun manuallyDrained(lifecycleHooks: LifecycleHooks = LifecycleHooks()) =
      ControllableJSHeapAccessExecutor(Mode.MANUAL, lifecycleHooks)
  }
}
