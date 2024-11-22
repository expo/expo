package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import expo.modules.kotlin.exception.CollectionElementCastException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.recycle
import kotlin.reflect.KType

class SetTypeConverter(
  converterProvider: TypeConverterProvider,
  private val setType: KType
) : DynamicAwareTypeConverters<Set<*>>(setType.isMarkedNullable) {
  private val elementConverter = converterProvider.obtainTypeConverter(
    requireNotNull(setType.arguments.first().type) {
      "The set type should contain the type of elements."
    }
  )

  override fun convertFromDynamic(value: Dynamic): Set<*> {
    val jsArray = value.asArray()
    return convertFromReadableArray(jsArray)
  }

  override fun convertFromAny(value: Any): Set<*> {
    return if (elementConverter.isTrivial()) {
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
          elementConverter.convert(it)
        }
      }.toSet()
    }
  }

  private fun convertFromReadableArray(jsArray: ReadableArray): Set<*> {
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
          elementConverter.convert(this)
        }
      }
    }.toSet()
  }

  override fun getCppRequiredTypes(): ExpectedType {
    return ExpectedType.forList(elementConverter.getCppRequiredTypes())
  }

  override fun isTrivial() = false
}
