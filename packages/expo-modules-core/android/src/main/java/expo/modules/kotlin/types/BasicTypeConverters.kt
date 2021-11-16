package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap

class IntTypeConverter(isOptional: Boolean) : TypeConverter<Int>(isOptional) {
  override fun convertNonOptional(value: Dynamic): Int = value.asInt()
}

class DoubleTypeConverter(isOptional: Boolean) : TypeConverter<Double>(isOptional) {
  override fun convertNonOptional(value: Dynamic): Double = value.asDouble()
}

class FloatTypeConverter(isOptional: Boolean) : TypeConverter<Float>(isOptional) {
  override fun convertNonOptional(value: Dynamic): Float = value.asDouble().toFloat()
}

class BoolTypeConverter(isOptional: Boolean) : TypeConverter<Boolean>(isOptional) {
  override fun convertNonOptional(value: Dynamic): Boolean = value.asBoolean()
}

class StringTypeConverter(isOptional: Boolean) : TypeConverter<String>(isOptional) {
  override fun convertNonOptional(value: Dynamic): String = value.asString()
}

class ReadableArrayTypeConverter(isOptional: Boolean) : TypeConverter<ReadableArray>(isOptional) {
  override fun convertNonOptional(value: Dynamic): ReadableArray = value.asArray()
}

class ReadableMapTypeConverter(isOptional: Boolean) : TypeConverter<ReadableMap>(isOptional) {
  override fun convertNonOptional(value: Dynamic): ReadableMap = value.asMap()
}

class PrimitiveIntArrayTypeConverter(isOptional: Boolean) : TypeConverter<IntArray>(isOptional) {
  override fun convertNonOptional(value: Dynamic): IntArray {
    val jsArray = value.asArray()
    return IntArray(jsArray.size()) { index ->
      jsArray.getInt(index)
    }
  }
}

class PrimitiveDoubleArrayTypeConverter(isOptional: Boolean) : TypeConverter<DoubleArray>(isOptional) {
  override fun convertNonOptional(value: Dynamic): DoubleArray {
    val jsArray = value.asArray()
    return DoubleArray(jsArray.size()) { index ->
      jsArray.getDouble(index)
    }
  }
}

class PrimitiveFloatArrayTypeConverter(isOptional: Boolean) : TypeConverter<FloatArray>(isOptional) {
  override fun convertNonOptional(value: Dynamic): FloatArray {
    val jsArray = value.asArray()
    return FloatArray(jsArray.size()) { index ->
      jsArray.getDouble(index).toFloat()
    }
  }
}
