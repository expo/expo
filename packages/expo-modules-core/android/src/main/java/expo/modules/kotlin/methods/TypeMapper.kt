package expo.modules.kotlin.methods

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.RecordCaster

object TypeMapper {
  private val typeMap = mapOf<Class<*>, TypeCaster<*>>(
    Int::class.java to IntCaster(),
    Int::class.javaObjectType to IntCaster(),
    Double::class.java to DoubleCaster(),
    Double::class.javaObjectType to DoubleCaster(),
    Boolean::class.java to BoolCaster(),
    Boolean::class.javaObjectType to BoolCaster(),
    String::class.java to StringCaster(),
    ReadableArray::class.java to ReadableArrayCaster(),
    ReadableMap::class.java to ReadableMapCaster(),
    List::class.java to ListCaster(),
    Map::class.java to MapCaster(),
    IntArray::class.java to PrimitiveIntArrayCaster(),
    DoubleArray::class.java to PrimitiveDoubleArrayCaster(),
    Array<Int>::class.java to IntArrayCaster(),
    Array<String>::class.java to StringArrayCaster()
  )
  private val recordCaster = RecordCaster()

  @Suppress("UNCHECKED_CAST")
  fun <T> cast(jsValue: Dynamic, toClass: TypeInformation<T>): T? {
    if (jsValue.isNull) {
      if (!toClass.isNullable) {
        throw IllegalArgumentException("Cannot assign null to not nullable type.")
      }

      return null
    }

    val type = toClass.type

    // TODO(@lukmccall): handel collection
    val caster = typeMap[type] as? TypeCaster<T>
    if (caster != null) {
      return caster.cast(jsValue)
    }

    if (Record::class.java.isAssignableFrom(type) && jsValue.type == ReadableType.Map) {
      return recordCaster.cast(jsValue.asMap(), type as Class<Record>) as T
    }

    throw java.lang.IllegalArgumentException("Cannot converted JavaScript object into $type")
  }
}
