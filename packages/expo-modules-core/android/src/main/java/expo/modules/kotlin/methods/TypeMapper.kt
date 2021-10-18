package expo.modules.kotlin.methods

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap

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

  fun <T> cast(value: Dynamic, toClass: TypeInformation<T>): T? {
    if (value.isNull) {
      if (!toClass.isNullable) {
        throw IllegalArgumentException("Cannot assign null to not nullable type.")
      }

      return null
    }

    @Suppress("UNCHECKED_CAST")
    val caster = typeMap[toClass.type] as TypeCaster<T>

    return caster.cast(value)
  }
}
