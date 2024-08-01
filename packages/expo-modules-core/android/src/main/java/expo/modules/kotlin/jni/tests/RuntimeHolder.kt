@file:Suppress("KotlinJniMissingFunction")

package expo.modules.kotlin.jni.tests

import com.facebook.jni.HybridData
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl
import expo.modules.core.interfaces.DoNotStrip
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Provides a way to create a new JSI runtime and a dummy call invoker.
 * Used for testing purposes only.
 * It can't be moved to test package, because it uses the cpp code.
 * We don't want to generate another cpp library just to export those functions.
 */
@DoNotStrip
internal class RuntimeHolder : AutoCloseable {
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
