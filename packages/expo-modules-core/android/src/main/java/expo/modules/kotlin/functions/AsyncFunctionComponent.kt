package expo.modules.kotlin.functions

import com.facebook.react.bridge.ReadableArray
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.objects.enforceType
import expo.modules.kotlin.types.AnyType

@Suppress("UNCHECKED_CAST")
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
      enforceType<(args: Array<out Any?>) -> Int>(body)
      IntAsyncFunctionComponent(name, desiredArgsTypes, body)
    }
    Boolean::class.java -> BoolAsyncFunctionComponent(name, desiredArgsTypes, body as (Array<out Any?>) -> Boolean)
    Double::class.java -> DoubleAsyncFunctionComponent(name, desiredArgsTypes, body as (Array<out Any?>) -> Double)
    Float::class.java -> FloatAsyncFunctionComponent(name, desiredArgsTypes, body as (Array<out Any?>) -> Float)
    String::class.java -> StringAsyncFunctionComponent(name, desiredArgsTypes, body as (Array<out Any?>) -> String)
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
