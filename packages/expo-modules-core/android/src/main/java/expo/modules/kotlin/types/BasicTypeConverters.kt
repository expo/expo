package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import expo.modules.kotlin.typedarray.BigInt64Array
import expo.modules.kotlin.typedarray.BigUint64Array
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.typedarray.Float32Array
import expo.modules.kotlin.typedarray.Float64Array
import expo.modules.kotlin.typedarray.Int16Array
import expo.modules.kotlin.typedarray.Int32Array
import expo.modules.kotlin.typedarray.Int8Array
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.jni.JavaScriptTypedArray
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.typedarray.AnyTypedArray
import expo.modules.kotlin.typedarray.Uint16Array
import expo.modules.kotlin.typedarray.Uint32Array
import expo.modules.kotlin.typedarray.Uint8Array
import expo.modules.kotlin.typedarray.Uint8ClampedArray

class IntTypeConverter(isOptional: Boolean) : DynamicAwareTypeConverters<Int>(isOptional) {
  override fun convertFromDynamic(value: Dynamic): Int = value.asInt()
  override fun convertFromAny(value: Any): Int = when (value) {
    is Number -> value.toInt()
    else -> value as Int
  }

  override fun getCppRequiredTypes(): List<CppType> = listOf(CppType.DOUBLE)
}

class DoubleTypeConverter(isOptional: Boolean) : DynamicAwareTypeConverters<Double>(isOptional) {
  override fun convertFromDynamic(value: Dynamic): Double = value.asDouble()
  override fun convertFromAny(value: Any): Double = when (value) {
    is Number -> value.toDouble()
    else -> value as Double
  }

  override fun getCppRequiredTypes(): List<CppType> = listOf(CppType.DOUBLE)
}

class FloatTypeConverter(isOptional: Boolean) : DynamicAwareTypeConverters<Float>(isOptional) {
  override fun convertFromDynamic(value: Dynamic): Float = value.asDouble().toFloat()
  override fun convertFromAny(value: Any): Float = when (value) {
    is Number -> value.toFloat()
    else -> value as Float
  }

  override fun getCppRequiredTypes(): List<CppType> = listOf(CppType.DOUBLE)
}

class BoolTypeConverter(isOptional: Boolean) : DynamicAwareTypeConverters<Boolean>(isOptional) {
  override fun convertFromDynamic(value: Dynamic): Boolean = value.asBoolean()
  override fun convertFromAny(value: Any): Boolean = value as Boolean
  override fun getCppRequiredTypes(): List<CppType> = listOf(CppType.BOOLEAN)
}

class StringTypeConverter(isOptional: Boolean) : DynamicAwareTypeConverters<String>(isOptional) {
  override fun convertFromDynamic(value: Dynamic): String = value.asString()
  override fun convertFromAny(value: Any): String = value as String
  override fun getCppRequiredTypes(): List<CppType> = listOf(CppType.STRING)
}

class ReadableArrayTypeConverter(isOptional: Boolean) : DynamicAwareTypeConverters<ReadableArray>(isOptional) {
  override fun convertFromDynamic(value: Dynamic): ReadableArray = value.asArray()
  override fun convertFromAny(value: Any): ReadableArray = value as ReadableArray
  override fun getCppRequiredTypes(): List<CppType> = listOf(CppType.READABLE_ARRAY)
}

class ReadableMapTypeConverter(isOptional: Boolean) : DynamicAwareTypeConverters<ReadableMap>(isOptional) {
  override fun convertFromDynamic(value: Dynamic): ReadableMap = value.asMap()
  override fun convertFromAny(value: Any): ReadableMap = value as ReadableMap
  override fun getCppRequiredTypes(): List<CppType> = listOf(CppType.READABLE_MAP)
}

class PrimitiveIntArrayTypeConverter(isOptional: Boolean) : DynamicAwareTypeConverters<IntArray>(isOptional) {
  override fun convertFromDynamic(value: Dynamic): IntArray {
    val jsArray = value.asArray()
    return IntArray(jsArray.size()) { index ->
      jsArray.getInt(index)
    }
  }

  override fun convertFromAny(value: Any): IntArray = value as IntArray
  override fun getCppRequiredTypes(): List<CppType> = listOf(CppType.READABLE_ARRAY)
}

class PrimitiveDoubleArrayTypeConverter(isOptional: Boolean) : DynamicAwareTypeConverters<DoubleArray>(isOptional) {
  override fun convertFromDynamic(value: Dynamic): DoubleArray {
    val jsArray = value.asArray()
    return DoubleArray(jsArray.size()) { index ->
      jsArray.getDouble(index)
    }
  }

  override fun convertFromAny(value: Any): DoubleArray = value as DoubleArray
  override fun getCppRequiredTypes(): List<CppType> = listOf(CppType.READABLE_ARRAY)
}

class PrimitiveFloatArrayTypeConverter(isOptional: Boolean) : DynamicAwareTypeConverters<FloatArray>(isOptional) {
  override fun convertFromDynamic(value: Dynamic): FloatArray {
    val jsArray = value.asArray()
    return FloatArray(jsArray.size()) { index ->
      jsArray.getDouble(index).toFloat()
    }
  }

  override fun convertFromAny(value: Any): FloatArray = value as FloatArray
  override fun getCppRequiredTypes(): List<CppType> = listOf(CppType.READABLE_ARRAY)
}

class JavaScriptValueTypeConvert(isOptional: Boolean) : TypeConverter<JavaScriptValue>(isOptional) {
  override fun convertNonOptional(value: Any): JavaScriptValue = value as JavaScriptValue
  override fun getCppRequiredTypes(): List<CppType> = CppType.values().toList()
}

class JavaScriptObjectTypeConverter(isOptional: Boolean) : TypeConverter<JavaScriptObject>(isOptional) {
  override fun convertNonOptional(value: Any): JavaScriptObject = value as JavaScriptObject
  override fun getCppRequiredTypes(): List<CppType> = listOf(CppType.JS_OBJECT)
}

abstract class BaseTypeArrayConverter<T : AnyTypedArray>(isOptional: Boolean) : TypeConverter<T>(isOptional) {
  abstract fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray): T

  override fun convertNonOptional(value: Any): T = wrapJavaScriptTypedArray(value as JavaScriptTypedArray)

  override fun getCppRequiredTypes(): List<CppType> = listOf(CppType.TYPED_ARRAY)
}

class Int8ArrayTypeConverter(isOptional: Boolean) : BaseTypeArrayConverter<Int8Array>(isOptional) {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray) = Int8Array(value)
}

class Int16ArrayTypeConverter(isOptional: Boolean) : BaseTypeArrayConverter<Int16Array>(isOptional) {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray) = Int16Array(value)
}

class Int32ArrayTypeConverter(isOptional: Boolean) : BaseTypeArrayConverter<Int32Array>(isOptional) {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray) = Int32Array(value)
}

class Uint8ArrayTypeConverter(isOptional: Boolean) : BaseTypeArrayConverter<Uint8Array>(isOptional) {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray) = Uint8Array(value)
}

class Uint8ClampedArrayTypeConverter(isOptional: Boolean) : BaseTypeArrayConverter<Uint8ClampedArray>(isOptional) {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray) = Uint8ClampedArray(value)
}

class Uint16ArrayTypeConverter(isOptional: Boolean) : BaseTypeArrayConverter<Uint16Array>(isOptional) {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray) = Uint16Array(value)
}

class Uint32ArrayTypeConverter(isOptional: Boolean) : BaseTypeArrayConverter<Uint32Array>(isOptional) {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray) = Uint32Array(value)
}

class Float32ArrayTypeConverter(isOptional: Boolean) : BaseTypeArrayConverter<Float32Array>(isOptional) {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray) = Float32Array(value)
}

class Float64ArrayTypeConverter(isOptional: Boolean) : BaseTypeArrayConverter<Float64Array>(isOptional) {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray) = Float64Array(value)
}

class BigInt64ArrayTypeConverter(isOptional: Boolean) : BaseTypeArrayConverter<BigInt64Array>(isOptional) {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray) = BigInt64Array(value)
}

class BigUint64ArrayTypeConverter(isOptional: Boolean) : BaseTypeArrayConverter<BigUint64Array>(isOptional) {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray) = BigUint64Array(value)
}

class TypedArrayTypeConverter(isOptional: Boolean) : BaseTypeArrayConverter<AnyTypedArray>(isOptional) {
  override fun wrapJavaScriptTypedArray(value: JavaScriptTypedArray): AnyTypedArray = value
}
