package expo.modules.backgroundtask

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import kotlinx.coroutines.CompletableDeferred
import okhttp3.internal.wait

class BackgroundTaskWork(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
  private val TAG: String = BackgroundTaskWork::class.java.simpleName

  companion object {
    private var invokeWork: ((completableDeferred : CompletableDeferred<Boolean>) -> Unit)? = null

    // Function to set the callback
    fun setInvokeWorkFunction(cb: ((completableDeferred : CompletableDeferred<Boolean>) -> Unit)?) {
      invokeWork = cb
    }

    // Function to retrieve the callback
    fun getInvokeWorkFunction(): ((completableDeferred : CompletableDeferred<Boolean>) -> Unit)? {
      return invokeWork
    }

    // Function to execute the callback if it's set
    fun executeInvokeWork(completableDeferred : CompletableDeferred<Boolean>) {
      invokeWork?.invoke(completableDeferred)
    }
  }

  override suspend fun doWork(): Result {

    Log.i(TAG, "BackgroundTask worker doWork called.")

    val completableDeferred = CompletableDeferred<Boolean>()

    try {
      // Tell the module that we can run events
      if (getInvokeWorkFunction() != null) {
        Log.i(TAG, "Executing callback to notify BackgroundTask module that it can send events to JS.")
        executeInvokeWork(completableDeferred)
      } else {
        Log.e(TAG, "BackgroundTask worker callback was not set.")
      }
    } catch (e: Exception) {
      Log.e(TAG, "BackgroundTask worker failed with error " + e.message)
      return Result.failure()
    }

    Log.i(TAG, "BackgroundTask worker waiting for JS side to finish")
    completableDeferred.wait()

    Log.i(TAG, "BackgroundTask worker successfully finished.")
    return Result.success()
  }
}