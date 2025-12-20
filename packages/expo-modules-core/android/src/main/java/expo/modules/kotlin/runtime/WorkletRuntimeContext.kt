package expo.modules.kotlin.runtime

import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JNIDeallocator
import expo.modules.kotlin.jni.JSIContext
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.jni.WorkletRuntimeInstaller
import expo.modules.kotlin.logger
import expo.modules.kotlin.sharedobjects.ClassRegistry
import expo.modules.kotlin.sharedobjects.SharedObjectRegistry
import expo.modules.kotlin.tracing.trace
import expo.modules.kotlin.weak
import java.lang.ref.WeakReference

class WorkletRuntimeContext(
  appContext: AppContext,
  private val reactContextHolder: WeakReference<ReactApplicationContext>
) : RuntimeContext() {
  override lateinit var jsiContext: JSIContext

  private val appContextHolder = appContext.weak()

  override val sharedObjectRegistry: SharedObjectRegistry = SharedObjectRegistry(this)

  override val classRegistry: ClassRegistry = ClassRegistry()

  private fun isJSIContextInitialized(): Boolean {
    return this::jsiContext.isInitialized
  }

  override val appContext: AppContext?
    get() = appContextHolder.get()

  override val reactContext: ReactApplicationContext?
    get() = reactContextHolder.get()

  override val deallocator: JNIDeallocator = JNIDeallocator()

  override fun eval(source: String): JavaScriptValue {
    return jsiContext.evaluateScript(source)
  }

  override fun schedule(block: () -> Unit) {
    reactContext?.runOnJSQueueThread(block)
  }

  internal fun install(runtimePointer: Long) = synchronized(this) {
    if (isJSIContextInitialized()) {
      logger.warn("⚠️ JSI interop was already installed")
      return
    }

    trace("$this.install on runtime $runtimePointer") {
      jsiContext = WorkletRuntimeInstaller(this)
        .install(runtimePointer)

      logger.info("✅ JSI interop was installed")
    }
  }

  override fun deallocate() {
    deallocator.deallocate()
  }
}
