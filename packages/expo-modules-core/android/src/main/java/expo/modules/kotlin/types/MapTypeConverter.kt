package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.ReadableMap
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CollectionElementCastException
import expo.modules.kotlin.exception.DynamicCastException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.recycle
import expo.modules.kotlin.types.descriptors.TypeDescriptor

class MapTypeConverter(
  converterProvider: TypeConverterProvider,
  private val mapType: TypeDescriptor
) : DynamicAwareTypeConverters<Map<*, *>>() {
  init {
    require(mapType.params.first().jClass == String::class.java) {
      "The map key type should be String, but received ${mapType.params.first()}."
    }
  }

  private val valueConverter = converterProvider.obtainTypeConverter(
    requireNotNull(mapType.params.getOrNull(1)) {
      "The map type should contain the key type."
    }
  )

  override fun convertFromDynamic(value: Dynamic, context: AppContext?, forceConversion: Boolean): Map<*, *> {
    val jsMap = value.asMap() ?: throw DynamicCastException(ReadableMap::class)
    return convertFromReadableMap(jsMap, context, forceConversion)
  }

  override fun convertFromAny(value: Any, context: AppContext?, forceConversion: Boolean): Map<*, *> {
    return if (valueConverter.isTrivial() && !forceConversion) {
      value as Map<*, *>
    } else {
      (value as Map<*, *>).mapValues { (_, v) ->
        exceptionDecorator({ cause ->
          CollectionElementCastException(
            mapType,
            mapType.params[1],
            v!!::class,
            cause
          )
        }) {
          valueConverter.convert(v, context, forceConversion)
        }
      }
    }
  }

  private fun convertFromReadableMap(jsMap: ReadableMap, context: AppContext?, forceConversion: Boolean): Map<*, *> {
    val result = mutableMapOf<String, Any?>()

    jsMap.entryIterator.forEach { (key, value) ->
      DynamicFromObject(value).recycle {
        exceptionDecorator({ cause ->
          CollectionElementCastException(mapType, mapType.params[1], type, cause)
        }) {
          result[key] = valueConverter.convert(this, context, forceConversion)
        }
      }
    }

    return result
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType.forMap(
    valueConverter.getCppRequiredTypes()
  )

  override fun isTrivial() = valueConverter.isTrivial()
}
