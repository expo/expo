package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CollectionElementCastException
import expo.modules.kotlin.exception.DynamicCastException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.recycle
import kotlin.reflect.KType

class SetTypeConverter(
  converterProvider: TypeConverterProvider,
  private val setType: KType
) : DynamicAwareTypeConverters<Set<*>>() {
  private val elementConverter = converterProvider.obtainTypeConverter(
    requireNotNull(setType.arguments.first().type) {
      "The set type should contain the type of elements."
    }
  )

  override fun convertFromDynamic(value: Dynamic, context: AppContext?, forceConversion: Boolean): Set<*> {
    val jsArray = value.asArray() ?: throw DynamicCastException(ReadableArray::class)
    return convertFromReadableArray(jsArray, context, forceConversion)
  }

  override fun convertFromAny(value: Any, context: AppContext?, forceConversion: Boolean): Set<*> {
    return if (elementConverter.isTrivial() && !forceConversion) {
      (value as List<*>).toSet()
    } else {
      (value as List<*>).map {
        exceptionDecorator({ cause ->
          CollectionElementCastException(
            setType,
            setType.arguments.first().type!!,
            it!!::class,
            cause
          )
        }) {
          elementConverter.convert(it, context, forceConversion)
        }
      }.toSet()
    }
  }

  private fun convertFromReadableArray(jsArray: ReadableArray, context: AppContext?, forceConversion: Boolean): Set<*> {
    return List(jsArray.size()) { index ->
      jsArray.getDynamic(index).recycle {
        exceptionDecorator({ cause ->
          CollectionElementCastException(
            setType,
            setType.arguments.first().type!!,
            type,
            cause
          )
        }) {
          elementConverter.convert(this, context, forceConversion)
        }
      }
    }.toSet()
  }

  override fun getCppRequiredTypes(): ExpectedType {
    return ExpectedType.forList(elementConverter.getCppRequiredTypes())
  }

  override fun isTrivial() = false
}
