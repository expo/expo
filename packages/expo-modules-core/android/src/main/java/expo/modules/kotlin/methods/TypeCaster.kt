package expo.modules.kotlin.methods

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap

interface TypeCaster<To> {
  fun cast(value: Dynamic): To
}

class IntCaster : TypeCaster<Int> {
  override fun cast(value: Dynamic): Int = value.asInt()
}

class DoubleCaster : TypeCaster<Double> {
  override fun cast(value: Dynamic): Double = value.asDouble()
}

class BoolCaster : TypeCaster<Boolean> {
  override fun cast(value: Dynamic): Boolean = value.asBoolean()
}

class StringCaster : TypeCaster<String> {
  override fun cast(value: Dynamic): String = value.asString()
}

class ReadableArrayCaster : TypeCaster<ReadableArray> {
  override fun cast(value: Dynamic): ReadableArray = value.asArray()
}

class ReadableMapCaster : TypeCaster<ReadableMap> {
  override fun cast(value: Dynamic): ReadableMap = value.asMap()
}

class ListCaster : TypeCaster<List<Any?>> {
  // TODO(@lukmccall): make it faster
  override fun cast(value: Dynamic): List<Any?> = value.asArray().toArrayList().toList()
}

class MapCaster : TypeCaster<Map<String, Any?>> {
  override fun cast(value: Dynamic): Map<String, Any?> = value.asMap().toHashMap()
}

class PrimitiveIntArrayCaster : TypeCaster<IntArray> {
  override fun cast(value: Dynamic): IntArray = value.asArray().toArrayList().map { (it as Double).toInt() }.toIntArray()
}

class PrimitiveDoubleArrayCaster : TypeCaster<DoubleArray> {
  override fun cast(value: Dynamic): DoubleArray = value.asArray().toArrayList().map { (it as Double) }.toDoubleArray()
}

class IntArrayCaster : TypeCaster<Array<Int?>> {
  override fun cast(value: Dynamic): Array<Int?> = value.asArray().toArrayList().map { (it as? Double)?.toInt() }.toTypedArray()
}

class StringArrayCaster : TypeCaster<Array<String?>> {
  override fun cast(value: Dynamic): Array<String?> = value.asArray().toArrayList().map { it as? String }.toTypedArray()
}
