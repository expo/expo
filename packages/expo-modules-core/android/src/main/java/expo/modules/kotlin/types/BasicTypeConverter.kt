package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap

class BasicTypeConverter : TypeConverter {
  interface SimpleDynamicConverter<ConvertToType : Any> {
    fun cast(value: Dynamic): ConvertToType
  }

  class IntConverter : SimpleDynamicConverter<Int> {
    override fun cast(value: Dynamic): Int = value.asInt()
  }

  class DoubleConverter : SimpleDynamicConverter<Double> {
    override fun cast(value: Dynamic): Double = value.asDouble()
  }

  class FloatConverter : SimpleDynamicConverter<Float> {
    override fun cast(value: Dynamic): Float = value.asDouble().toFloat()
  }

  class BoolConverter : SimpleDynamicConverter<Boolean> {
    override fun cast(value: Dynamic): Boolean = value.asBoolean()
  }

  class StringConverter : SimpleDynamicConverter<String> {
    override fun cast(value: Dynamic): String = value.asString()
  }

  class ReadableArrayConverter : SimpleDynamicConverter<ReadableArray> {
    override fun cast(value: Dynamic): ReadableArray = value.asArray()
  }

  class ReadableMapConverter : SimpleDynamicConverter<ReadableMap> {
    override fun cast(value: Dynamic): ReadableMap = value.asMap()
  }

  class PrimitiveIntArrayConverter : SimpleDynamicConverter<IntArray> {
    override fun cast(value: Dynamic): IntArray = value.asArray().toArrayList().map { (it as Double).toInt() }.toIntArray()
  }

  class PrimitiveDoubleArrayConverter : SimpleDynamicConverter<DoubleArray> {
    override fun cast(value: Dynamic): DoubleArray = value.asArray().toArrayList().map { (it as Double) }.toDoubleArray()
  }

  class PrimitiveFloatArray : SimpleDynamicConverter<FloatArray> {
    override fun cast(value: Dynamic): FloatArray = value.asArray().toArrayList().map { (it as Double).toFloat() }.toFloatArray()
  }

  private val fromDynamicTypeMapper = mapOf(
    Int::class to IntConverter(),
    java.lang.Integer::class to IntConverter(),

    Double::class to DoubleConverter(),
    java.lang.Double::class to DoubleConverter(),

    Boolean::class to BoolConverter(),
    java.lang.Boolean::class to BoolConverter(),

    Float::class to FloatConverter(),
    java.lang.Float::class to FloatConverter(),

    String::class to StringConverter(),

    ReadableArray::class to ReadableArrayConverter(),
    ReadableMap::class to ReadableMapConverter(),

    IntArray::class to PrimitiveIntArrayConverter(),
    DoubleArray::class to PrimitiveDoubleArrayConverter(),
    FloatArray::class to PrimitiveFloatArray()
  )

  override fun canHandleConversion(toType: KClassTypeWrapper): Boolean =
    fromDynamicTypeMapper[toType.classifier] != null

  override fun convert(jsValue: Dynamic, toType: KClassTypeWrapper): Any =
    fromDynamicTypeMapper[toType.classifier]!!.cast(jsValue)
}
