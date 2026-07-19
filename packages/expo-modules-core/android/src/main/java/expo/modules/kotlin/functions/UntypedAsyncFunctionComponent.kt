package expo.modules.kotlin.functions

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.types.AnyType
import expo.modules.kotlin.types.enforceType

inline fun <reified ReturnType> createAsyncFunctionComponent(
  name: String,
  desiredArgsTypes: Array<AnyType>,
  noinline body: (args: Array<out Any?>) -> ReturnType
): AsyncFunctionComponent {
  if (null is ReturnType) {
    return UntypedAsyncFunctionComponent<Any?>(name, desiredArgsTypes, body)
  }
  return when (ReturnType::class.java) {
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
    else -> UntypedAsyncFunctionComponent<Any?>(name, desiredArgsTypes, body)
  }
}

class IntAsyncFunctionComponent(name: String, desiredArgsTypes: Array<AnyType>, body: (args: Array<out Any?>) -> Int) :
  UntypedAsyncFunctionComponent<Int>(name, desiredArgsTypes, body) {
  override fun callUserImplementation(args: Array<Any?>, promise: Promise, appContext: AppContext) {
    promise.resolve(body(convertArgs(args, appContext)))
  }
}

class BoolAsyncFunctionComponent(name: String, desiredArgsTypes: Array<AnyType>, body: (args: Array<out Any?>) -> Boolean) :
  UntypedAsyncFunctionComponent<Boolean>(name, desiredArgsTypes, body) {
  override fun callUserImplementation(args: Array<Any?>, promise: Promise, appContext: AppContext) {
    promise.resolve(body(convertArgs(args, appContext)))
  }
}

class DoubleAsyncFunctionComponent(name: String, desiredArgsTypes: Array<AnyType>, body: (args: Array<out Any?>) -> Double) :
  UntypedAsyncFunctionComponent<Double>(name, desiredArgsTypes, body) {
  override fun callUserImplementation(args: Array<Any?>, promise: Promise, appContext: AppContext) {
    promise.resolve(body(convertArgs(args, appContext)))
  }
}

class FloatAsyncFunctionComponent(name: String, desiredArgsTypes: Array<AnyType>, body: (args: Array<out Any?>) -> Float) :
  UntypedAsyncFunctionComponent<Float>(name, desiredArgsTypes, body) {
  override fun callUserImplementation(args: Array<Any?>, promise: Promise, appContext: AppContext) {
    promise.resolve(body(convertArgs(args, appContext)))
  }
}

class StringAsyncFunctionComponent(name: String, desiredArgsTypes: Array<AnyType>, body: (args: Array<out Any?>) -> String) :
  UntypedAsyncFunctionComponent<String>(name, desiredArgsTypes, body) {
  override fun callUserImplementation(args: Array<Any?>, promise: Promise, appContext: AppContext) {
    promise.resolve(body(convertArgs(args, appContext)))
  }
}

open class UntypedAsyncFunctionComponent<ReturnType>(
  name: String,
  desiredArgsTypes: Array<AnyType>,
  protected val body: (args: Array<out Any?>) -> ReturnType
) : AsyncFunctionComponent(name, desiredArgsTypes) {
  override fun callUserImplementation(args: Array<Any?>, promise: Promise, appContext: AppContext) {
    promise.resolve(body(convertArgs(args, appContext)))
  }
}
