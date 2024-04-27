package expo.modules.kotlin.jni

import expo.modules.BuildConfig
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.PromiseAlreadySettledException
import expo.modules.kotlin.logger
import expo.modules.kotlin.types.JSTypeConverter
import java.lang.ref.WeakReference

private const val ERROR_STACK_FRAME_LIMIT = 50

private const val ERROR_DEFAULT_MESSAGE = "Error not specified."

// Keys for reject WritableMap
private const val ERROR_MAP_KEY_CODE = "code"
private const val ERROR_MAP_KEY_MESSAGE = "message"
private const val ERROR_MAP_KEY_USER_INFO = "userInfo"
private const val ERROR_MAP_KEY_NATIVE_STACK = "nativeStackAndroid"

// Keys for ERROR_MAP_KEY_NATIVE_STACK's StackFrame maps
private const val STACK_FRAME_KEY_CLASS = "class"
private const val STACK_FRAME_KEY_FILE = "file"
private const val STACK_FRAME_KEY_LINE_NUMBER = "lineNumber"
private const val STACK_FRAME_KEY_METHOD_NAME = "methodName"

@DoNotStrip
class PromiseImpl @DoNotStrip internal constructor(
  @DoNotStrip internal val callback: JavaCallback
) : Promise {
  internal var wasSettled = false
    private set
  private var appContextHolder: WeakReference<AppContext>? = null
  private var fullFunctionName: String? = null

  override fun resolve(value: Any?) = checkIfWasSettled {
    callback.invoke(
      JSTypeConverter.convertToJSValue(value)
    )
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
