package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import com.facebook.react.bridge.NativeMap
import expo.modules.core.interfaces.DoNotStrip

/**
 * A class to communicate with CPP part of the [expo.modules.kotlin.modules.Module] class.
 * Used to register exported JSI functions.
 * The lifetime of instances of this class should be in sync with the lifetime of the bridge.
 * All exported functions/objects will have a reference to the `JavaScriptModuleObject`,
 * so it must outlive the current RN context.
 */
@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class JavaScriptModuleObject {
  // Has to be called "mHybridData" - fbjni uses it via reflection
  @DoNotStrip
  private val mHybridData = initHybrid()

  private external fun initHybrid(): HybridData

  /**
   * Exports constants
   */
  external fun exportConstants(constants: NativeMap)

  /**
   * Register a promise-less function on the CPP module representation.
   * After calling this function, user can access the exported function in the JS code.
   */
  external fun registerSyncFunction(name: String, args: Int, desiredTypes: IntArray, body: JNIFunctionBody)

  /**
   * Register a promise function on the CPP module representation.
   * After calling this function, user can access the exported function in the JS code.
   */
  external fun registerAsyncFunction(name: String, args: Int, desiredTypes: IntArray, body: JNIAsyncFunctionBody)

  external fun registerProperty(name: String, desiredType: Int, getter: JNIFunctionBody?, setter: JNIFunctionBody?)

  @Throws(Throwable::class)
  protected fun finalize() {
    mHybridData.resetNative()
  }
}
