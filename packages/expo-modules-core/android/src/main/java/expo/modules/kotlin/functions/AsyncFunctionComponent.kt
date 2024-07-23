package expo.modules.kotlin.functions

import com.facebook.react.bridge.ReadableArray
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.types.AnyType
import expo.modules.kotlin.types.enforceType

inline fun <reified T> createAsyncFunctionComponent(
  name: String,
  desiredArgsTypes: Array<AnyType>,
  noinline body: (args: Array<out Any?>) -> T
): AsyncFunction {
  if (null is T) {
    return AsyncFunctionComponent<Any?>(name, desiredArgsTypes, body)
  }
  return when (T::class.java) {
    Int::class.java -> {
      enforceType<(Array<out Any?>) -> Int>(body)
      IntAsyncFunctionComponent(name, desiredArgsTypes, body)
    }
    Boolean::class.java -> {
      enforceType<(Array<out Any?>) -> Boolean>(body)
      BoolAsyncFunctionComponent(name, desiredArgsTypes, body)
    }
    Double::class.java -> {
      enforceType<(Array<out Any?>) -> Double>(body)
      DoubleAsyncFunctionComponent(name, desiredArgsTypes, body)
    }
    Float::class.java -> {
      enforceType<(Array<out Any?>) -> Float>(body)
      FloatAsyncFunctionComponent(name, desiredArgsTypes, body)
    }
    String::class.java -> {
      enforceType<(Array<out Any?>) -> String>(body)
      StringAsyncFunctionComponent(name, desiredArgsTypes, body)
    }
    else -> AsyncFunctionComponent<Any?>(name, desiredArgsTypes, body)
  }
}

class IntAsyncFunctionComponent(name: String, desiredArgsTypes: Array<AnyType>, body: (args: Array<out Any?>) -> Int) :
  AsyncFunctionComponent<Int>(name, desiredArgsTypes, body) {
  override fun callUserImplementation(args: Array<Any?>, promise: Promise, appContext: AppContext) {
    promise.resolve(body(convertArgs(args, appContext)))
  }
}

class BoolAsyncFunctionComponent(name: String, desiredArgsTypes: Array<AnyType>, body: (args: Array<out Any?>) -> Boolean) :
  AsyncFunctionComponent<Boolean>(name, desiredArgsTypes, body) {
  override fun callUserImplementation(args: Array<Any?>, promise: Promise, appContext: AppContext) {
    promise.resolve(body(convertArgs(args, appContext)))
  }
}

class DoubleAsyncFunctionComponent(name: String, desiredArgsTypes: Array<AnyType>, body: (args: Array<out Any?>) -> Double) :
  AsyncFunctionComponent<Double>(name, desiredArgsTypes, body) {
  override fun callUserImplementation(args: Array<Any?>, promise: Promise, appContext: AppContext) {
    promise.resolve(body(convertArgs(args, appContext)))
  }
}

class FloatAsyncFunctionComponent(name: String, desiredArgsTypes: Array<AnyType>, body: (args: Array<out Any?>) -> Float) :
  AsyncFunctionComponent<Float>(name, desiredArgsTypes, body) {
  override fun callUserImplementation(args: Array<Any?>, promise: Promise, appContext: AppContext) {
    promise.resolve(body(convertArgs(args, appContext)))
  }
}

class StringAsyncFunctionComponent(name: String, desiredArgsTypes: Array<AnyType>, body: (args: Array<out Any?>) -> String) :
  AsyncFunctionComponent<String>(name, desiredArgsTypes, body) {
  override fun callUserImplementation(args: Array<Any?>, promise: Promise, appContext: AppContext) {
    promise.resolve(body(convertArgs(args, appContext)))
  }
}

open class AsyncFunctionComponent<ReturnType>(
  name: String,
  desiredArgsTypes: Array<AnyType>,
  protected val body: (args: Array<out Any?>) -> ReturnType
) : AsyncFunction(name, desiredArgsTypes) {
  @Throws(CodedException::class)
  override fun callUserImplementation(args: ReadableArray, promise: Promise) {
    promise.resolve(body(convertArgs(args)))
  }

  override fun callUserImplementation(args: Array<Any?>, promise: Promise, appContext: AppContext) {
    promise.resolve(body(convertArgs(args, appContext)))
  }
}
