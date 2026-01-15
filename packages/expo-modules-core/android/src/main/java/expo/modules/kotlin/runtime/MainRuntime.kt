package expo.modules.kotlin.runtime

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.common.annotations.FrameworkAPI
import expo.modules.core.utilities.ifNull
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.ModuleHolder
import expo.modules.kotlin.defaultmodules.CoreModule
import expo.modules.kotlin.jni.JNIDeallocator
import expo.modules.kotlin.jni.JSIContext
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.jni.MainRuntimeInstaller
import expo.modules.kotlin.logger
import expo.modules.kotlin.sharedobjects.ClassRegistry
import expo.modules.kotlin.sharedobjects.SharedObjectRegistry
import expo.modules.kotlin.tracing.trace
import expo.modules.kotlin.weak
import java.lang.ref.WeakReference

/**
 * A context that holds the state of modules bounded to the JS runtime.
 */
class MainRuntime(
  appContext: AppContext,
  val reactContextHolder: WeakReference<ReactApplicationContext>
) : Runtime() {
  private val appContextHolder = appContext.weak()

  override val appContext: AppContext?
    get() = appContextHolder.get()

  override val reactContext: ReactApplicationContext?
    get() = reactContextHolder.get()

  override lateinit var jsiContext: JSIContext

  private fun isJSIContextInitialized(): Boolean {
    return this::jsiContext.isInitialized
  }

  /**
   * Evaluates JavaScript code represented as a string.
   */
  override fun eval(source: String): JavaScriptValue {
    return jsiContext.evaluateScript(source)
  }

  /**
   * Runs a code block on the JavaScript thread.
   */
  override fun schedule(block: () -> Unit) {
    // TODO(@lukmccall): start using RuntimeScheduler
    reactContext?.runOnJSQueueThread(block)
  }

  /**
   * The core module that defines the `expo` object in the global scope of the JS runtime.
   *
   * Note: in current implementation this module won't receive any events.
   */
  internal val coreModule = run {
    val module = CoreModule()
    module._appContextHolder = appContextHolder
    ModuleHolder(module, null)
  }

  override val deallocator: JNIDeallocator = JNIDeallocator()

  override val sharedObjectRegistry = SharedObjectRegistry(this)

  override val classRegistry = ClassRegistry()

  /**
   * Initializes a JSI part of the module registry.
   * It will be a NOOP if the remote debugging was activated.
   */
  @OptIn(FrameworkAPI::class)
  internal fun install() = synchronized(this) {
    if (isJSIContextInitialized()) {
      logger.warn("⚠️ JSI interop was already installed")
      return
    }

    trace("$this.install") {
      try {
        val reactContext = reactContextHolder.get() ?: return@trace
        val jsContextHolder = reactContext.javaScriptContextHolder?.get() ?: return@trace

        val jsRuntimePointer = jsContextHolder.takeIf { it != 0L }.ifNull {
          logger.error("❌ Cannot install JSI interop - JS runtime pointer is null")
          return@trace
        }

        jsiContext = MainRuntimeInstaller(this)
          .install(
            jsRuntimePointer,
            reactContext.catalystInstance.runtimeExecutor!!
          )

        logger.info("✅ JSI interop was installed")
      } catch (e: Throwable) {
        logger.error("❌ Cannot install JSI interop: $e", e)
      }
    }
  }

  override fun deallocate() {
    deallocator.deallocate()
  }
}
