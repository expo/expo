@file:Suppress("KotlinJniMissingFunction")

package expo.modules.kotlin.jni.decorators

import com.facebook.jni.HybridData
import com.facebook.react.bridge.NativeMap
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.jni.Destructible
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.jni.JNIAsyncFunctionBody
import expo.modules.kotlin.jni.JNIDeallocator
import expo.modules.kotlin.jni.JNINoArgsFunctionBody
import expo.modules.kotlin.jni.JNIFunctionBody

/**
 * This class was introduced to bridge the gap between Kotlin and cpp only once.
 * Dealing with JNI for each type of decorator was hard to get right.
 */
class JSDecoratorsBridgingObject(jniDeallocator: JNIDeallocator) : Destructible {

  @DoNotStrip
  private val mHybridData = initHybrid()

  private external fun initHybrid(): HybridData

  init {
    jniDeallocator.addReference(this)
  }

  external fun registerConstants(constants: NativeMap)

  external fun registerSyncFunction(
    name: String,
    takesOwner: Boolean,
    enumerable: Boolean,
    desiredTypes: Array<ExpectedType>,
    body: JNIFunctionBody
  )

  external fun registerAsyncFunction(
    name: String,
    takesOwner: Boolean,
    enumerable: Boolean,
    desiredTypes: Array<ExpectedType>,
    body: JNIAsyncFunctionBody
  )

  external fun registerProperty(
    name: String,
    getterTakesOwner: Boolean,
    getterExpectedType: Array<ExpectedType>,
    getter: JNIFunctionBody?,
    setterTakesOwner: Boolean,
    setterExpectedType: Array<ExpectedType>,
    setter: JNIFunctionBody?
  )

  external fun registerConstant(
    name: String,
    getter: JNINoArgsFunctionBody?
  )

  external fun registerObject(
    name: String,
    jsDecoratorsBridgingObject: JSDecoratorsBridgingObject
  )

  external fun registerClass(
    name: String,
    prototypeDecorator: JSDecoratorsBridgingObject,
    takesOwner: Boolean,
    ownerClass: Class<*>?,
    isSharedRef: Boolean,
    desiredTypes: Array<ExpectedType>,
    body: JNIFunctionBody
  )

  override fun deallocate() {
    mHybridData.resetNative()
  }

  @Throws(Throwable::class)
  protected fun finalize() {
    deallocate()
  }
}
