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

abstract class BaseTypeArrayConverter<T : TypedArray>() : NonNullableTypeConverter<T>() {
  override fun convertNonNullable(value: Any, context: AppContext?, forceConversion: Boolean): T = wrapJavaScriptTypedArray(value as JavaScriptTypedArray)
  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.TYPED_ARRAY)
  override fun isTrivial() = false

  abstract fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray): T
}

class Int8ArrayTypeConverter() : BaseTypeArrayConverter<Int8Array>() {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray) = Int8Array(value)
}

class Int16ArrayTypeConverter() : BaseTypeArrayConverter<Int16Array>() {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray) = Int16Array(value)
}

class Int32ArrayTypeConverter() : BaseTypeArrayConverter<Int32Array>() {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray) = Int32Array(value)
}

class Uint8ArrayTypeConverter() : BaseTypeArrayConverter<Uint8Array>() {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray) = Uint8Array(value)
}

class Uint8ClampedArrayTypeConverter() : BaseTypeArrayConverter<Uint8ClampedArray>() {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray) = Uint8ClampedArray(value)
}

class Uint16ArrayTypeConverter() : BaseTypeArrayConverter<Uint16Array>() {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray) = Uint16Array(value)
}

class Uint32ArrayTypeConverter() : BaseTypeArrayConverter<Uint32Array>() {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray) = Uint32Array(value)
}

class Float32ArrayTypeConverter() : BaseTypeArrayConverter<Float32Array>() {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray) = Float32Array(value)
}

class Float64ArrayTypeConverter() : BaseTypeArrayConverter<Float64Array>() {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray) = Float64Array(value)
}

class BigInt64ArrayTypeConverter() : BaseTypeArrayConverter<BigInt64Array>() {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray) = BigInt64Array(value)
}

class BigUint64ArrayTypeConverter() : BaseTypeArrayConverter<BigUint64Array>() {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray) = BigUint64Array(value)
}

class TypedArrayTypeConverter() : BaseTypeArrayConverter<TypedArray>() {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray): TypedArray = value
  override fun isTrivial() = true
}
