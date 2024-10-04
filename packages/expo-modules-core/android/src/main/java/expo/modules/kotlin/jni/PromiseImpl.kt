package expo.modules.kotlin.jni

import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.Promise
import expo.modules.kotlin.types.JSTypeConverter

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
  @DoNotStrip internal val resolveBlock: JavaCallback,
  @DoNotStrip internal val rejectBlock: JavaCallback
) : Promise {
  private var wasResolve = false

  override fun resolve(value: Any?) = checkIfWasResolved {
    resolveBlock(
      JSTypeConverter.convertToJSValue(value)
    )
  }

  // Copy of the reject method from [com.facebook.react.bridge.PromiseImpl]
  override fun reject(code: String, message: String?, cause: Throwable?) = checkIfWasResolved {
    val errorInfo = WritableNativeMap()

    errorInfo.putString(ERROR_MAP_KEY_CODE, code)

    // Use the custom message if provided otherwise use the throwable message.
    if (message != null) {
      errorInfo.putString(ERROR_MAP_KEY_MESSAGE, message)
    } else if (cause != null) {
      errorInfo.putString(ERROR_MAP_KEY_MESSAGE, cause.message)
    } else {
      // The JavaScript side expects a map with at least an error message.
      // /Libraries/BatchedBridge/NativeModules.js -> createErrorFromErrorData
      // TYPE: (errorData: { message: string })
      errorInfo.putString(ERROR_MAP_KEY_MESSAGE, ERROR_DEFAULT_MESSAGE)
    }

    // For consistency with iOS ensure userInfo key exists, even if we null it.
    // iOS: /React/Base/RCTUtils.m -> RCTJSErrorFromCodeMessageAndNSError
    errorInfo.putNull(ERROR_MAP_KEY_USER_INFO)

    // Attach a nativeStackAndroid array if a throwable was passed
    // this matches iOS behavior - iOS adds a `nativeStackIOS` property
    // iOS: /React/Base/RCTUtils.m -> RCTJSErrorFromCodeMessageAndNSError
    if (cause != null) {
      val stackTrace: Array<StackTraceElement> = cause.stackTrace
      val nativeStackAndroid = WritableNativeArray()

      // Build an an Array of StackFrames to match JavaScript:
      // iOS: /Libraries/Core/Devtools/parseErrorStack.js -> StackFrame
      var i = 0
      while (i < stackTrace.size && i < ERROR_STACK_FRAME_LIMIT) {
        val frame = stackTrace[i]
        val frameMap: WritableMap = WritableNativeMap()
        // NOTE: no column number exists StackTraceElement
        frameMap.putString(STACK_FRAME_KEY_CLASS, frame.className)
        frameMap.putString(STACK_FRAME_KEY_FILE, frame.fileName)
        frameMap.putInt(STACK_FRAME_KEY_LINE_NUMBER, frame.lineNumber)
        frameMap.putString(STACK_FRAME_KEY_METHOD_NAME, frame.methodName)
        nativeStackAndroid.pushMap(frameMap)
        i++
      }
      errorInfo.putArray(ERROR_MAP_KEY_NATIVE_STACK, nativeStackAndroid)
    } else {
      errorInfo.putArray(ERROR_MAP_KEY_NATIVE_STACK, WritableNativeArray())
    }

    rejectBlock.invoke(errorInfo)
  }

  private inline fun checkIfWasResolved(body: () -> Unit) {
    if (wasResolve) {
      return
    }

    body()
    wasResolve = true
  }
}
