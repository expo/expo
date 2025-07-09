package expo.modules.kotlin

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl
import expo.modules.core.utilities.ifNull
import expo.modules.kotlin.defaultmodules.CoreModule
import expo.modules.kotlin.jni.JNIDeallocator
import expo.modules.kotlin.jni.JSIContext
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.sharedobjects.ClassRegistry
import expo.modules.kotlin.sharedobjects.SharedObjectRegistry
import expo.modules.kotlin.tracing.trace
import java.lang.ref.WeakReference

/**
 * A context that holds the state of modules bounded to the JS runtime.
 */
class RuntimeContext(
  appContext: AppContext,
  val reactContextHolder: WeakReference<ReactApplicationContext>
) {
  private val appContextHolder = appContext.weak()

  val appContext: AppContext?
    get() = appContextHolder.get()

  inline val reactContext: ReactApplicationContext?
    get() = reactContextHolder.get()

  val registry = ModuleRegistry(this.weak())

  internal lateinit var jsiContext: JSIContext

  private fun isJSIContextInitialized(): Boolean {
    return this::jsiContext.isInitialized
  }

  /**
   * Evaluates JavaScript code represented as a string.
   */
  fun eval(source: String): JavaScriptValue {
    return jsiContext.evaluateScript(source)
  }

  /**
   * The core module that defines the `expo` object in the global scope of the JS runtime.
   *
   * Note: in current implementation this module won't receive any events.
   */
  internal val coreModule = run {
    val module = CoreModule()
    module._runtimeContext = this
    ModuleHolder(module)
  }

  val jniDeallocator: JNIDeallocator = JNIDeallocator()

  internal val sharedObjectRegistry = SharedObjectRegistry(this)

  internal val classRegistry = ClassRegistry()

  /**
   * Initializes a JSI part of the module registry.
   * It will be a NOOP if the remote debugging was activated.
   */
  @OptIn(FrameworkAPI::class)
  fun installJSIContext() = synchronized(this) {
    if (isJSIContextInitialized()) {
      logger.warn("⚠️ JSI interop was already installed")
      return
    }

    trace("$this.installJSIContext") {
      try {
        jsiContext = JSIContext()
        val reactContext = reactContextHolder.get() ?: return@trace
        val jsContextHolder = reactContext.javaScriptContextHolder?.get() ?: return@trace

        val jsRuntimePointer = jsContextHolder.takeIf { it != 0L }.ifNull {
          logger.error("❌ Cannot install JSI interop - JS runtime pointer is null")
          return@trace
        }

        @Suppress("DEPRECATION")
        if (reactContext.isBridgeless) {
          jsiContext.installJSIForBridgeless(
            this,
            jsRuntimePointer,
            reactContext.catalystInstance.runtimeExecutor!!
          )
        } else {
          jsiContext.installJSI(
            this,
            jsRuntimePointer,
            reactContext.catalystInstance.jsCallInvokerHolder as CallInvokerHolderImpl
          )
        }

        logger.info("✅ JSI interop was installed")
      } catch (e: Throwable) {
        logger.error("❌ Cannot install JSI interop: $e", e)
      }
    }
  }

  fun deallocate() {
    coreModule.module._runtimeContext = null
    jniDeallocator.deallocate()
  }
}
