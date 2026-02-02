package expo.modules.kotlin.records

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableMap
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.allocators.ObjectConstructor
import expo.modules.kotlin.allocators.ObjectConstructorFactory
import expo.modules.kotlin.exception.DynamicCastException
import expo.modules.kotlin.exception.FieldCastException
import expo.modules.kotlin.exception.FieldRequiredException
import expo.modules.kotlin.exception.RecordCastException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.recycle
import expo.modules.kotlin.types.DynamicAwareTypeConverters
import expo.modules.kotlin.types.TypeConverter
import expo.modules.kotlin.types.TypeConverterProvider
import kotlin.reflect.KClass
import kotlin.reflect.KProperty1
import kotlin.reflect.KType
import kotlin.reflect.full.findAnnotation
import kotlin.reflect.full.memberProperties
import kotlin.reflect.jvm.javaField

class RecordTypeConverter<T : Record>(
  private val converterProvider: TypeConverterProvider,
  val type: KType
) : DynamicAwareTypeConverters<T>() {
  private val objectConstructorFactory = ObjectConstructorFactory()
  private val propertyDescriptors: Map<KProperty1<out Any, *>, PropertyDescriptor> by lazy {
    (type.classifier as KClass<*>)
      .memberProperties
      .mapNotNull { property ->
        val fieldAnnotation = property.findAnnotation<Field>() ?: return@mapNotNull null
        val typeConverter = converterProvider.obtainTypeConverter(property.returnType)

        return@mapNotNull property to PropertyDescriptor(
          typeConverter,
          fieldAnnotation,
          isRequired = property.findAnnotation<Required>() != null
        )
      }
      .toMap()
  }

  override fun convertFromDynamic(value: Dynamic, context: AppContext?, forceConversion: Boolean): T =
    exceptionDecorator({ cause -> RecordCastException(type, cause) }) {
      val jsMap = value.asMap() ?: throw DynamicCastException(ReadableMap::class)
      return@exceptionDecorator convertFromReadableMap(jsMap, context, forceConversion)
    }

  override fun convertFromAny(value: Any, context: AppContext?, forceConversion: Boolean): T {
    if (value is ReadableMap) {
      return convertFromReadableMap(value, context, forceConversion)
    }

    @Suppress("UNCHECKED_CAST")
    return value as T
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.READABLE_MAP)

  override fun isTrivial(): Boolean = false

  private fun convertFromReadableMap(jsMap: ReadableMap, context: AppContext?, forceConversion: Boolean): T {
    val kClass = type.classifier as KClass<*>
    val instance = getObjectConstructor(kClass).construct()

    propertyDescriptors
      .forEach { (property, descriptor) ->
        val jsKey = descriptor.fieldAnnotation.key.takeUnless { it.isBlank() } ?: property.name

        if (!jsMap.hasKey(jsKey)) {
          if (descriptor.isRequired) {
            throw FieldRequiredException(property)
          }

          return@forEach
        }

        jsMap.getDynamic(jsKey).recycle {
          val javaField = property.javaField!!

          val casted = exceptionDecorator({ cause -> FieldCastException(property.name, property.returnType, type, cause) }) {
            descriptor.typeConverter.convert(this, context, forceConversion)
          }

          javaField.isAccessible = true
          javaField.set(instance, casted)
        }
      }

    @Suppress("UNCHECKED_CAST")
    return instance as T
  }

  internal fun convertFromMap(map: Map<String, Any?>, context: AppContext? = null, forceConversion: Boolean = false): T {
    val kClass = type.classifier as KClass<*>
    val instance = getObjectConstructor(kClass).construct()

    propertyDescriptors
      .forEach { (property, descriptor) ->
        val key = descriptor.fieldAnnotation.key.takeUnless { it.isBlank() } ?: property.name

        if (!map.containsKey(key)) {
          if (descriptor.isRequired) {
            throw FieldRequiredException(property)
          }

          return@forEach
        }

        val rawValue = map[key]
        // Normalize numeric types since JS numbers come as Double in Kotlin Maps
        val value = if (rawValue is Number) {
          when (property.returnType.classifier) {
            Int::class -> rawValue.toInt()
            Long::class -> rawValue.toLong()
            Float::class -> rawValue.toFloat()
            Double::class -> rawValue.toDouble()
            else -> rawValue
          }
        } else {
          rawValue
        }
        val javaField = property.javaField!!

        val casted = exceptionDecorator({ cause -> FieldCastException(property.name, property.returnType, type, cause) }) {
          descriptor.typeConverter.convert(value, context, forceConversion)
        }

        javaField.isAccessible = true
        javaField.set(instance, casted)
      }

    @Suppress("UNCHECKED_CAST")
    return instance as T
  }

  private fun <T : Any> getObjectConstructor(clazz: KClass<T>): ObjectConstructor<T> {
    return objectConstructorFactory.get(clazz)
  }

  private data class PropertyDescriptor(
    val typeConverter: TypeConverter<*>,
    val fieldAnnotation: Field,
    val isRequired: Boolean
  )
}

/**
 * Converts a Kotlin Map to a Record type.
 *
 * **Important:** The map should come from a converted JavaScript object (e.g., from props deserialization).
 * The values in the map are expected to be JS primitive types:
 * - Numbers (as Double)
 * - Strings
 * - Booleans
 * - Nested Maps (for nested records)
 * - Lists (for arrays)
 *
 * This function handles numeric type normalization since JS numbers come as Double in Kotlin Maps.
 */
@PublishedApi
internal fun <T : Record> recordFromMap(map: Map<String, Any?>, converter: RecordTypeConverter<T>): T {
  return converter.convertFromMap(map)
}

inline fun <reified T : Record> recordFromMap(map: Map<String, Any?>): T {
  val converter = expo.modules.kotlin.types.TypeConverterProviderImpl.obtainTypeConverter(kotlin.reflect.typeOf<T>())
  @Suppress("UNCHECKED_CAST")
  return recordFromMap(map, converter as RecordTypeConverter<T>)
}
