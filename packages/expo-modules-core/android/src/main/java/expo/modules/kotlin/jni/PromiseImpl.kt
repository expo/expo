package expo.modules.kotlin.jni

import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import java.lang.ref.WeakReference
import java.util.concurrent.atomic.AtomicBoolean

@DoNotStrip
class PromiseImpl @DoNotStrip internal constructor(
  @DoNotStrip internal val callback: JavaCallback
) : Promise {
  private val settled = AtomicBoolean(false)
  internal val wasSettled: Boolean
    get() = settled.get()
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

  override fun resolve(result: Collection<Any?>) = checkIfWasSettled {
    callback.invoke(result)
  }

  override fun resolve(result: Map<String, Any?>) = checkIfWasSettled {
    callback.invoke(result)
  }

  // Copy of the reject method from [com.facebook.react.bridge.PromiseImpl]
  override fun reject(code: String?, message: String?, cause: Throwable?) = checkIfWasSettled {
    // TODO(@lukmccall): Add information about the stack trace to the error message
    callback.invoke(code, message ?: cause?.message ?: "unknown")
  }

  private inline fun checkIfWasSettled(body: () -> Unit) {
    if (!settled.compareAndSet(false, true)) {
      return
    }

    try {
      body()
    } catch (e: Throwable) {
      settled.set(false)
      throw e
    }
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
