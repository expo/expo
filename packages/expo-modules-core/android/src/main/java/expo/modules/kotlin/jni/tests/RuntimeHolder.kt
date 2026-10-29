@file:Suppress("KotlinJniMissingFunction")

package expo.modules.kotlin.jni.tests

import com.facebook.jni.HybridData
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl
import com.facebook.soloader.SoLoader
import expo.modules.core.interfaces.DoNotStrip
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Provides a way to create a new JSI runtime and a dummy call invoker.
 * Used for testing purposes only.
 * It can't be moved to the test package, because it uses the cpp code.
 * The native part lives in the `expo-modules-core-tests` library, which is built from source only
 * for the package's own instrumentation tests, so the prebuilt `expo-modules-core` can be used there too.
 */
internal class RuntimeHolder : AutoCloseable {
  companion object {
    init {
      SoLoader.loadLibrary("expo-modules-core-tests")
    }
  }

  // Has to be called "mHybridData" - fbjni uses it via reflection
  @DoNotStrip
  private val mHybridData = initHybrid()

  private external fun initHybrid(): HybridData

  external fun createRuntime(): Long

  @OptIn(FrameworkAPI::class)
  external fun createCallInvoker(): CallInvokerHolderImpl

  private external fun release()

  private var wasDeallocated = AtomicBoolean(false)

  @Throws(Throwable::class)
  protected fun finalize() {
    close()
  }

  override fun close() {
    if (wasDeallocated.compareAndSet(false, true)) {
      release()
      mHybridData.resetNative()
    }
  }
}
