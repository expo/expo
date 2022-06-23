package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.jni.JavaScriptValue

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
