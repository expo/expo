package expo.modules.kotlin.records

import com.facebook.react.bridge.ReadableMap
import expo.modules.kotlin.methods.TypeInformation
import expo.modules.kotlin.methods.TypeMapper
import expo.modules.kotlin.allocators.ObjectConstructor
import expo.modules.kotlin.allocators.ObjectConstructorFactory
import kotlin.reflect.full.findAnnotation
import kotlin.reflect.full.memberProperties
import kotlin.reflect.jvm.javaField

class RecordCaster {
  private val objectConstructorFactory = ObjectConstructorFactory()

  fun <T : Record> cast(jsValue: ReadableMap, toClass: Class<T>): T {
    val instance = getObjectConstructor(toClass).construct()

    toClass.kotlin
      .memberProperties
      .map { property ->
        val filedInformation = property.findAnnotation<Field>() ?: return@map
        val jsKey = filedInformation.key.takeUnless { it == "" } ?: property.name

        if (!jsValue.hasKey(jsKey)) {
          // TODO(@lukmccall): handle required keys
          return@map
        }

        val value = jsValue.getDynamic(jsKey)

        val javaField = property.javaField!!

        val casted = TypeMapper.cast(
          value,
          TypeInformation(javaField.type, property.returnType.isMarkedNullable)
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
