package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableType
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CollectionElementCastException
import expo.modules.kotlin.exception.DynamicCastException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.recycle
import kotlin.reflect.KType

class ListTypeConverter(
  converterProvider: TypeConverterProvider,
  private val listType: KType
) : DynamicAwareTypeConverters<List<*>>() {
  private val elementConverter = converterProvider.obtainTypeConverter(
    requireNotNull(listType.arguments.first().type) {
      "The list type should contain the type of elements."
    }
  )

  override fun convertFromDynamic(value: Dynamic, context: AppContext?, forceConversion: Boolean): List<*> {
    if (value.type != ReadableType.Array) {
      return listOf(
        exceptionDecorator({ cause ->
          CollectionElementCastException(
            listType,
            listType.arguments.first().type!!,
            value::class,
            cause
          )
        }) {
          elementConverter.convert(value, context, forceConversion)
        }
      )
    }

    val jsArray = value.asArray() ?: throw DynamicCastException(ReadableArray::class)
    return convertFromReadableArray(jsArray, context, forceConversion)
  }

  override fun convertFromAny(value: Any, context: AppContext?, forceConversion: Boolean): List<*> {
    return if (elementConverter.isTrivial() && !forceConversion) {
      value as List<*>
    } else {
      (value as List<*>).map {
        exceptionDecorator({ cause ->
          CollectionElementCastException(
            listType,
            listType.arguments.first().type!!,
            it!!::class,
            cause
          )
        }) {
          elementConverter.convert(it, context, forceConversion)
        }
      }
    }
  }

  private fun convertFromReadableArray(jsArray: ReadableArray, context: AppContext?, forceConversion: Boolean): List<*> {
    return List(jsArray.size()) { index ->
      jsArray.getDynamic(index).recycle {
        exceptionDecorator({ cause ->
          CollectionElementCastException(
            listType,
            listType.arguments.first().type!!,
            type,
            cause
          )
        }) {
          elementConverter.convert(this, context, forceConversion)
        }
      }
    }
  }

  override fun getCppRequiredTypes(): ExpectedType {
    return ExpectedType.forList(elementConverter.getCppRequiredTypes())
  }

  override fun isTrivial() = elementConverter.isTrivial()
}
