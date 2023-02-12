package expo.modules.kotlin.jni

import expo.modules.core.interfaces.DoNotStrip

/**
 * It's a wrapper for a promise-less function that will be invoked from JS.
 * This interface is intended to be passed to cpp code.
 * If you want to modify it, please don't forget to change the corresponding jni::JavaClass.
 */
@DoNotStrip
fun interface JNIFunctionBody {
  /**
   * Invokes the Kotlin part of the JNI function.
   */
  @DoNotStrip
  fun invoke(args: Array<Any?>): Any?
}

/**
 * It's a wrapper for a promise function that will be invoked from JS.
 * This interface is intended to be passed to cpp code.
 * If you want to modify it, please don't forget to change the corresponding jni::JavaClass.
 */
@DoNotStrip
fun interface JNIAsyncFunctionBody {
  /**
   * Invokes the Kotlin part of the JNI function.
   */
  @DoNotStrip
  fun invoke(args: Array<Any?>, bridgePromise: PromiseImpl)
}
