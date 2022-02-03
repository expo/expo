package expo.modules.kotlin.records

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.allocators.ObjectConstructor
import expo.modules.kotlin.allocators.ObjectConstructorFactory
import expo.modules.kotlin.exception.FieldCastException
import expo.modules.kotlin.exception.RecordCastException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.recycle
import expo.modules.kotlin.types.TypeConverter
import expo.modules.kotlin.types.TypeConverterProvider
import kotlin.reflect.KClass
import kotlin.reflect.KType
import kotlin.reflect.full.findAnnotation
import kotlin.reflect.full.memberProperties
import kotlin.reflect.jvm.javaField

// TODO(@lukmccall): create all converters during initialization
class RecordTypeConverter<T : Record>(
  private val converterProvider: TypeConverterProvider,
  val type: KType,
) : TypeConverter<T>(type.isMarkedNullable) {
  private val objectConstructorFactory = ObjectConstructorFactory()

  override fun convertNonOptional(value: Dynamic): T = exceptionDecorator({ cause -> RecordCastException(type, cause) }) {
    val jsMap = value.asMap()

    val kClass = type.classifier as KClass<*>
    val instance = getObjectConstructor(kClass.java).construct()

    kClass
      .memberProperties
      .map { property ->
        val filedInformation = property.findAnnotation<Field>() ?: return@map
        val jsKey = filedInformation.key.takeUnless { it == "" } ?: property.name

        if (!jsMap.hasKey(jsKey)) {
          // TODO(@lukmccall): handle required keys
          return@map
        }

        jsMap.getDynamic(jsKey).recycle {
          val javaField = property.javaField!!

          val elementConverter = converterProvider.obtainTypeConverter(property.returnType)
          val casted = exceptionDecorator({ cause -> FieldCastException(property.name, property.returnType, type, cause) }) {
            elementConverter.convert(this)
          }

          javaField.isAccessible = true
          javaField.set(instance, casted)
        }
      }

    @Suppress("UNCHECKED_CAST")
    return instance as T
  }

  private fun <T> getObjectConstructor(clazz: Class<T>): ObjectConstructor<T> {
    return objectConstructorFactory.get(clazz)
  }
}
