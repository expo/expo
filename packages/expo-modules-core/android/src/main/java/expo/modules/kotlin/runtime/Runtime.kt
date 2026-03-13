package expo.modules.kotlin.runtime

import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JNIDeallocator
import expo.modules.kotlin.jni.JSIContext
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.sharedobjects.ClassRegistry
import expo.modules.kotlin.sharedobjects.SharedObjectRegistry

abstract class Runtime {
  abstract val appContext: AppContext?
  abstract val reactContext: ReactApplicationContext?
  abstract val jsiContext: JSIContext

  @PublishedApi
  internal abstract val deallocator: JNIDeallocator
  internal abstract val sharedObjectRegistry: SharedObjectRegistry
  internal abstract val classRegistry: ClassRegistry

  /**
   * Evaluates JavaScript code represented as a string.
   */
  abstract fun eval(source: String): JavaScriptValue

  /**
   * Runs a code block on the JavaScript thread.
   */
  abstract fun schedule(block: () -> Unit)

  internal abstract fun deallocate()
}
