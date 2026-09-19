package expo.modules.imagemanipulator

import android.graphics.Bitmap
import expo.modules.imagemanipulator.transformers.ImageTransformer
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.toCodedException
import expo.modules.kotlin.runtime.Runtime
import expo.modules.kotlin.sharedobjects.SharedObject
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.async

data class ManipulatorResult(
  private val value: Bitmap?,
  private val error: CodedException?
) {
  fun map(transformer: ImageTransformer): ManipulatorResult {
    if (error != null) {
      return ManipulatorResult(null, error)
    }

    return try {
      ManipulatorResult(
        transformer.transform(
          requireNotNull(value) { "The result doesn't have a value or error" }
        ),
        null
      )
    } catch (e: Throwable) {
      ManipulatorResult(null, e.toCodedException())
    }
  }

  fun get(): Bitmap {
    if (error != null) {
      throw error
    }
    return requireNotNull(value) { "The result doesn't have a value or error" }
  }
}

class ManipulatorTask(
  private val coroutineScope: CoroutineScope,
  private val loader: suspend () -> Bitmap
) {
  private var task: Deferred<ManipulatorResult> = launchLoader()

  private fun launchLoader(): Deferred<ManipulatorResult> = coroutineScope.async {
    try {
      ManipulatorResult(loader(), null)
    } catch (e: Throwable) {
      ManipulatorResult(null, e.toCodedException())
    }
  }

  fun addTransformer(transformer: ImageTransformer) {
    val oldTask = task
    task = coroutineScope.async {
      val currentValue = oldTask.await()
      return@async currentValue.map(transformer)
    }
  }

  suspend fun render(): Bitmap {
    return task.await().get()
  }

  fun reset() {
    task.cancel()
    task = launchLoader()
  }

  fun cancel() {
    task.cancel()
  }
}

class ImageManipulatorContext(
  runtime: Runtime,
  private val task: ManipulatorTask
) : SharedObject(runtime) {
  /**
   * Guards [pendingRenders]. [render] runs on the modules queue,
   * [sharedObjectDidRelease] on the JS thread.
   */
  private val lock = Any()

  /**
   * Number of `renderAsync` calls that are currently awaiting [task].
   */
  private var pendingRenders = 0

  fun addTransformer(transformer: ImageTransformer) = apply { task.addTransformer(transformer) }

  fun reset() = apply { task.reset() }

  suspend fun render(): Bitmap {
    synchronized(lock) { pendingRenders += 1 }
    try {
      return task.render()
    } finally {
      synchronized(lock) { pendingRenders -= 1 }
    }
  }

  override fun sharedObjectDidRelease() {
    // Cancelling the pipeline frees work that nothing is waiting for anymore, but this also runs
    // while a `renderAsync` call is still awaiting it - explicitly, as `useImageManipulator` does
    // on unmount, or because the garbage collector took the JS object. Cancelling there rejects
    // that call with a `JobCancellationException`, so only work with no awaiting call is cancelled.
    if (synchronized(lock) { pendingRenders == 0 }) {
      task.cancel()
    }
  }
}
