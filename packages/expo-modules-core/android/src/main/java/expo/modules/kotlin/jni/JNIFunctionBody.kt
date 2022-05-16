package expo.modules.kotlin.jni

import com.facebook.react.bridge.ReadableNativeArray

/**
 * It's a wrapper for a promise-less function that will be invoked from JS.
 * This interface is intended to be passed to cpp code.
 * If you want to modify it, please don't forget to change the corresponding jni::JavaClass.
 */
fun interface JNIFunctionBody {
  /**
   * Invokes the Kotlin part of the JNI function.
   *
   * We used a [com.facebook.react.bridge.ReadableNativeArray] to communicate with CPP, because
   * right now it's the only object which is recognizable by those two worlds.
   * In the future, we may want to swap it for something else.
   */
  fun invoke(args: ReadableNativeArray): ReadableNativeArray?
}

/**
 * It's a wrapper for a promise function that will be invoked from JS.
 * This interface is intended to be passed to cpp code.
 * If you want to modify it, please don't forget to change the corresponding jni::JavaClass.
 */
fun interface JNIAsyncFunctionBody {
  /**
   * Invokes the Kotlin part of the JNI function.
   *
   * Note: that the `bridgePromise` has type of [Any], but it should be an instance of [com.facebook.react.bridge.Promise].
   * This is dictated by the fact that [com.facebook.react.bridge.Promise] isn't a hybrid object of jni::HybridClass.
   */
  fun invoke(args: ReadableNativeArray, bridgePromise: Any)
}
