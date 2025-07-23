package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import expo.modules.kotlin.exception.DynamicCastException

class ExpoDynamic(private val dynamic: Dynamic) {
  enum class Type {
    Boolean,
    Number,
    String,
    Map,
    Array
  }

  val type: Type
    get() {
      return when (dynamic.type) {
        com.facebook.react.bridge.ReadableType.Null -> throw IllegalStateException("ExpoDynamic is null")
        com.facebook.react.bridge.ReadableType.Boolean -> Type.Boolean
        com.facebook.react.bridge.ReadableType.Number -> Type.Number
        com.facebook.react.bridge.ReadableType.String -> Type.String
        com.facebook.react.bridge.ReadableType.Map -> Type.Map
        com.facebook.react.bridge.ReadableType.Array -> Type.Array
      }
    }

  val isNull: Boolean
    get() {
      if (dynamic.isNull) {
        throw IllegalStateException("ExpoDynamic is null")
      }
      return false
    }

  fun asArray(): List<Any?> {
    return (dynamic.asArray() ?: throw DynamicCastException(ReadableArray::class)).toArrayList()
  }

  fun asBoolean(): Boolean {
    return dynamic.asBoolean()
  }

  fun asDouble(): Double {
    return dynamic.asDouble()
  }

  fun asInt(): Int {
    return dynamic.asInt()
  }

  fun asMap(): Map<String, Any?> {
    return (dynamic.asMap() ?: throw DynamicCastException(ReadableMap::class)).toHashMap()
  }

  fun asString(): String {
    return dynamic.asString() ?: throw DynamicCastException(String::class)
  }
}
