package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.jni.decorators.JSDecoratorsBridgingObject

/**
 * A class to communicate with CPP part of the [expo.modules.kotlin.modules.Module] class.
 * Used to register exported JSI functions.
 * The lifetime of instances of this class should be in sync with the lifetime of the bridge.
 * All exported functions/objects will have a reference to the `JavaScriptModuleObject`,
 * so it must outlive the current RN context.
 */
@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class JavaScriptModuleObject(
  jniDeallocator: JNIDeallocator,
  val name: String
) : Destructible {
  // Has to be called "mHybridData" - fbjni uses it via reflection
  @DoNotStrip
  private val mHybridData = initHybrid()

  private external fun initHybrid(): HybridData

  init {
    jniDeallocator.addReference(this)
  }

  val isValid: Boolean
    get() = mHybridData.isValid

  external fun decorate(decorator: JSDecoratorsBridgingObject)

  @Throws(Throwable::class)
  protected fun finalize() {
    deallocate()
  }

  override fun deallocate() {
    mHybridData.resetNative()
  }

  override fun toString(): String {
    return "JavaScriptModuleObject_$name"
  }
}
