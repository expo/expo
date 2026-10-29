package expo.modules.sensors

import com.google.android.gms.tasks.Task
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeout
import kotlin.coroutines.cancellation.CancellationException
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds

internal suspend fun <T> Task<T>.await(timeout: Duration = TaskTimeoutSeconds.seconds): T {
  val task = this
  return withTimeout(timeout) {
    suspendCancellableCoroutine { continuation ->
      task.addOnSuccessListener { continuation.resume(it) }
      task.addOnFailureListener { continuation.resumeWithException(it) }
      task.addOnCanceledListener { continuation.cancel() }
    }
  }
}

internal suspend fun <T> awaitTask(operationName: String, createTask: () -> Task<T>): T {
  val task = try {
    createTask()
  } catch (_: SecurityException) {
    throw missingActivityRecognitionPermission()
  }

  return try {
    task.await()
  } catch (_: TimeoutCancellationException) {
    throw TaskTimeoutException(operationName)
  } catch (e: CancellationException) {
    throw if (task.isCanceled) TaskCancelledException(operationName) else e
  } catch (_: SecurityException) {
    throw missingActivityRecognitionPermission()
  } catch (e: Exception) {
    throw TaskFailedException(operationName, e)
  }
}
