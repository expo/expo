package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableType
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CollectionElementCastException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.recycle
import kotlin.reflect.KType

class ListTypeConverter(
  converterProvider: TypeConverterProvider,
  private val listType: KType
) : DynamicAwareTypeConverters<List<*>>(listType.isMarkedNullable) {
  private val elementConverter = converterProvider.obtainTypeConverter(
    requireNotNull(listType.arguments.first().type) {
      "The list type should contain the type of elements."
    }
  )

  override fun convertFromDynamic(value: Dynamic, context: AppContext?): List<*> {
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
          elementConverter.convert(value, context)
        }
      )
    }

    val jsArray = value.asArray()
    return convertFromReadableArray(jsArray, context)
  }

  override fun convertFromAny(value: Any, context: AppContext?): List<*> {
    return if (elementConverter.isTrivial()) {
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
          elementConverter.convert(it, context)
        }
      }
    }
  }

  private fun convertFromReadableArray(jsArray: ReadableArray, context: AppContext?): List<*> {
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
          elementConverter.convert(this, context)
        }
      }
    }
  }

  override fun getCppRequiredTypes(): ExpectedType {
    return ExpectedType.forList(elementConverter.getCppRequiredTypes())
  }

  override fun isTrivial() = elementConverter.isTrivial()
}
