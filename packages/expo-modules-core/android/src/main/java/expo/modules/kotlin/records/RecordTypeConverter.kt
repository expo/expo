package expo.modules.kotlin.records

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.allocators.ObjectConstructor
import expo.modules.kotlin.allocators.ObjectConstructorFactory
import expo.modules.kotlin.types.KClassTypeWrapper
import expo.modules.kotlin.types.TypeConverter
import expo.modules.kotlin.types.TypeConverterHelper
import kotlin.reflect.full.findAnnotation
import kotlin.reflect.full.isSuperclassOf
import kotlin.reflect.full.memberProperties
import kotlin.reflect.jvm.javaField

class RecordTypeConverter : TypeConverter {
  private val objectConstructorFactory = ObjectConstructorFactory()

  override fun canHandleConversion(toType: KClassTypeWrapper): Boolean =
    Record::class.isSuperclassOf(toType.classifier)

  override fun convert(jsValue: Dynamic, toType: KClassTypeWrapper): Any {
    val jsMap = jsValue.asMap()

    val instance = getObjectConstructor(toType.classifier.java).construct()

    toType.classifier
      .memberProperties
      .map { property ->
        val filedInformation = property.findAnnotation<Field>() ?: return@map
        val jsKey = filedInformation.key.takeUnless { it == "" } ?: property.name

        if (!jsMap.hasKey(jsKey)) {
          // TODO(@lukmccall): handle required keys
          return@map
        }

        val value = jsMap.getDynamic(jsKey)
        val javaField = property.javaField!!

        val casted = TypeConverterHelper.convert(
          value,
          property.returnType
        )

        javaField.isAccessible = true
        javaField.set(instance, casted)
      }

    return instance
  }

  private fun <T> getObjectConstructor(clazz: Class<T>): ObjectConstructor<T> {
    return objectConstructorFactory.get(clazz)
  }
}
