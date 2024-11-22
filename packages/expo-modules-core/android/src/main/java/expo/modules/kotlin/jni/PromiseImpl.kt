package expo.modules.kotlin.jni

import expo.modules.BuildConfig
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.PromiseAlreadySettledException
import expo.modules.kotlin.logger
import java.lang.ref.WeakReference

@DoNotStrip
class PromiseImpl @DoNotStrip internal constructor(
  @DoNotStrip internal val callback: JavaCallback
) : Promise {
  internal var wasSettled = false
    private set
  private var appContextHolder: WeakReference<AppContext>? = null
  private var fullFunctionName: String? = null

  override fun resolve(value: Any?) = checkIfWasSettled {
    callback.invoke(value)
  }

  override fun resolve() = checkIfWasSettled {
    callback.invoke()
  }

  override fun resolve(result: Int) = checkIfWasSettled {
    callback.invoke(result)
  }

  override fun resolve(result: Boolean) = checkIfWasSettled {
    callback.invoke(result)
  }

  override fun resolve(result: Double) = checkIfWasSettled {
    callback.invoke(result)
  }

  override fun resolve(result: Float) = checkIfWasSettled {
    callback.invoke(result)
  }

  override fun resolve(result: String) = checkIfWasSettled {
    callback.invoke(result)
  }

  override fun resolve(result: Collection<Any?>) {
    callback.invoke(result)
  }

  override fun resolve(result: Map<String, Any?>) {
    callback.invoke(result)
  }

  // Copy of the reject method from [com.facebook.react.bridge.PromiseImpl]
  override fun reject(code: String, message: String?, cause: Throwable?) = checkIfWasSettled {
    // TODO(@lukmccall): Add information about the stack trace to the error message
    callback.invoke(code, message ?: cause?.message ?: "unknown")
  }

  private inline fun checkIfWasSettled(body: () -> Unit) {
    if (wasSettled) {
      val exception = PromiseAlreadySettledException(fullFunctionName ?: "unknown")
      val errorManager = appContextHolder?.get()?.errorManager
      // We want to report that a promise was settled twice in the development build.
      // However, in production, the app should crash.
      if (BuildConfig.DEBUG && errorManager != null) {
        errorManager.reportExceptionToLogBox(exception)
        logger.error("Trying to resolve promise that was already settled", exception)
        return
      }

      throw exception
    }

    body()
    wasSettled = true
  }

  fun decorateWithDebugInformation(
    appContextHolder: WeakReference<AppContext>,
    moduleName: String,
    functionName: String
  ) {
    this.appContextHolder = appContextHolder
    fullFunctionName = "$moduleName.$functionName"
  }
}
