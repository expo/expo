package expo.modules.kotlin.types

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.jni.JavaScriptTypedArray
import expo.modules.kotlin.typedarray.BigInt64Array
import expo.modules.kotlin.typedarray.BigUint64Array
import expo.modules.kotlin.typedarray.Float32Array
import expo.modules.kotlin.typedarray.Float64Array
import expo.modules.kotlin.typedarray.Int16Array
import expo.modules.kotlin.typedarray.Int32Array
import expo.modules.kotlin.typedarray.Int8Array
import expo.modules.kotlin.typedarray.TypedArray
import expo.modules.kotlin.typedarray.Uint16Array
import expo.modules.kotlin.typedarray.Uint32Array
import expo.modules.kotlin.typedarray.Uint8Array
import expo.modules.kotlin.typedarray.Uint8ClampedArray

open class BaseTypeArrayConverter<T : TypedArray>(
  val typedArrayWrapper: (rawArray: JavaScriptTypedArray) -> T
) : NonNullableTypeConverter<T>() {
  override fun convertNonNullable(value: Any, context: AppContext?, forceConversion: Boolean): T = wrapJavaScriptTypedArray(value as JavaScriptTypedArray)
  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.TYPED_ARRAY)
  override fun isTrivial() = false

  fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray): T = typedArrayWrapper(value)
}

class Int8ArrayTypeConverter() : BaseTypeArrayConverter<Int8Array>(::Int8Array)

class Int16ArrayTypeConverter() : BaseTypeArrayConverter<Int16Array>(::Int16Array)

class Int32ArrayTypeConverter() : BaseTypeArrayConverter<Int32Array>(::Int32Array)

class Uint8ArrayTypeConverter() : BaseTypeArrayConverter<Uint8Array>(::Uint8Array)

class Uint8ClampedArrayTypeConverter() : BaseTypeArrayConverter<Uint8ClampedArray>(::Uint8ClampedArray)

class Uint16ArrayTypeConverter() : BaseTypeArrayConverter<Uint16Array>(::Uint16Array)

class Uint32ArrayTypeConverter() : BaseTypeArrayConverter<Uint32Array>(::Uint32Array)

class Float32ArrayTypeConverter() : BaseTypeArrayConverter<Float32Array>(::Float32Array)

class Float64ArrayTypeConverter() : BaseTypeArrayConverter<Float64Array>(::Float64Array)

class BigInt64ArrayTypeConverter() : BaseTypeArrayConverter<BigInt64Array>(::BigInt64Array)

class BigUint64ArrayTypeConverter() : BaseTypeArrayConverter<BigUint64Array>(::BigUint64Array)

class TypedArrayTypeConverter() : BaseTypeArrayConverter<TypedArray>({ it }) {
  override fun isTrivial() = true
}
