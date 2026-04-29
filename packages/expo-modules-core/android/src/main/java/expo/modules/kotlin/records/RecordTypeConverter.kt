package expo.modules.kotlin.records

import android.util.Log
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
import expo.modules.kotlin.types.TypeConverterProviderImpl
import expo.modules.kotlin.types.descriptors.TypeDescriptor
import expo.modules.kotlin.types.descriptors.toRawTypeDescriptor
import expo.modules.kotlin.types.descriptors.toTypeDescriptor
import io.github.lukmccall.pika.PIntrospectionData
import kotlin.reflect.KClass
import kotlin.reflect.KProperty1
import kotlin.reflect.full.findAnnotation
import kotlin.reflect.full.memberProperties
import kotlin.reflect.jvm.javaField
import kotlin.reflect.typeOf

abstract class RecordConversionStrategy<T : Record>(
  protected val converterProvider: TypeConverterProvider,
  protected val typeDescriptor: TypeDescriptor
) {
  private val objectConstructorFactory = ObjectConstructorFactory()

  protected fun <T : Any> getObjectConstructor(clazz: KClass<T>): ObjectConstructor<T> {
    return objectConstructorFactory.get(clazz)
  }

  abstract fun convertFromReadableMap(jsMap: ReadableMap, context: AppContext?, forceConversion: Boolean): T
  abstract fun convertFromMap(map: Map<String, Any?>, context: AppContext?, forceConversion: Boolean): T
}

class ReflectionRecordConversionStrategy<T : Record>(
  converterProvider: TypeConverterProvider,
  typeDescriptor: TypeDescriptor
) : RecordConversionStrategy<T>(
  converterProvider,
  typeDescriptor
) {
  private data class PropertyDescriptor(
    val typeConverter: TypeConverter<*>,
    val fieldAnnotation: Field,
    val isRequired: Boolean
  )

  private val propertyDescriptors: Map<KProperty1<out Any, *>, PropertyDescriptor> by lazy {
    typeDescriptor
      .jClass
      .kotlin
      .memberProperties
      .mapNotNull { property ->
        val fieldAnnotation = property.findAnnotation<Field>() ?: return@mapNotNull null
        val typeConverter = converterProvider.obtainTypeConverter(
          property.returnType.toTypeDescriptor()
        )

        return@mapNotNull property to PropertyDescriptor(
          typeConverter,
          fieldAnnotation,
          isRequired = property.findAnnotation<Required>() != null
        )
      }
      .toMap()
  }

  override fun convertFromReadableMap(jsMap: ReadableMap, context: AppContext?, forceConversion: Boolean): T {
    val kClass = typeDescriptor.jClass.kotlin
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

          val casted = exceptionDecorator({ cause -> FieldCastException(property.name, property.returnType, typeDescriptor, cause) }) {
            descriptor.typeConverter.convert(this, context, forceConversion)
          }

          javaField.isAccessible = true
          javaField.set(instance, casted)
        }
      }

    @Suppress("UNCHECKED_CAST")
    return instance as T
  }

  override fun convertFromMap(map: Map<String, Any?>, context: AppContext?, forceConversion: Boolean): T {
    val kClass = typeDescriptor.jClass.kotlin
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

        val casted = exceptionDecorator({ cause -> FieldCastException(property.name, property.returnType, typeDescriptor, cause) }) {
          descriptor.typeConverter.convert(value, context, forceConversion)
        }

        javaField.isAccessible = true
        javaField.set(instance, casted)
      }

    @Suppress("UNCHECKED_CAST")
    return instance as T
  }
}

class IntrospectableRecordConversionStrategy<T : Record>(
  converterProvider: TypeConverterProvider,
  typeDescriptor: TypeDescriptor
) : RecordConversionStrategy<T>(
  converterProvider,
  typeDescriptor
) {
  val introspectableData: PIntrospectionData<*>
    get() = requireNotNull(typeDescriptor.typeInfo.introspection) {
      "Introspectable data is required for IntrospectableRecordConversionStrategy"
    }

  private data class PropertyDescriptor(
    val key: String,
    val typeDescriptor: TypeDescriptor,
    val setter: (Any, Any?) -> Unit,
    val typeConverter: TypeConverter<*>,
    val isRequired: Boolean
  )

  private val propertyDescriptors by lazy {
    introspectableData
      .properties
      .mapNotNull { property ->
        val fieldAnnotation = property
          .annotations
          .firstOrNull { annotation -> annotation.jClass == Field::class.java }
          ?: return@mapNotNull null

        val propertyName = (
          fieldAnnotation
            .arguments
            .getOrDefault("key", property.name) as String
          )
          .ifEmpty { property.name }

        val isRequired = property
          .annotations
          .any { annotation -> annotation.jClass == Required::class.java }

        val propertyRawTypeDescriptor = property.type.toRawTypeDescriptor()
        val propertyTypeDescriptor = TypeDescriptor(
          propertyRawTypeDescriptor,
          kTypeProvider = { error("CT type can't be obtain as KType") }
        )

        @Suppress("UNCHECKED_CAST")
        PropertyDescriptor(
          key = propertyName,
          typeDescriptor = propertyTypeDescriptor,
          setter = property.setter as (Any, Any?) -> Unit,
          typeConverter = converterProvider.obtainTypeConverter(propertyTypeDescriptor),
          isRequired = isRequired
        )
      }
  }

  override fun convertFromReadableMap(jsMap: ReadableMap, context: AppContext?, forceConversion: Boolean): T {
    val kClass = typeDescriptor.jClass.kotlin
    val instance = getObjectConstructor(kClass).construct()

    propertyDescriptors.forEach { property ->
      val key = property.key

      if (!jsMap.hasKey(key)) {
        if (property.isRequired) {
          throw FieldRequiredException(key)
        }

        return@forEach
      }

      jsMap.getDynamic(key).recycle {
        val casted = exceptionDecorator({ cause -> FieldCastException(property.key, property.typeDescriptor, typeDescriptor, cause) }) {
          property.typeConverter.convert(this, context, forceConversion)
        }

        property.setter(instance, casted)
      }
    }

    @Suppress("UNCHECKED_CAST")
    return instance as T
  }

  override fun convertFromMap(map: Map<String, Any?>, context: AppContext?, forceConversion: Boolean): T {
    val kClass = typeDescriptor.jClass.kotlin
    val instance = getObjectConstructor(kClass).construct()

    propertyDescriptors.forEach { property ->
      val key = property.key
      if (!map.containsKey(key)) {
        if (property.isRequired) {
          throw FieldRequiredException(key)
        }
        return@forEach
      }

      val rawValue = map[key]
      // Normalize numeric types since JS numbers come as Double in Kotlin Maps
      val value = if (rawValue is Number) {
        when (property.typeDescriptor.jClass) {
          Int::class.java -> rawValue.toInt()
          Long::class.java -> rawValue.toLong()
          Float::class.java -> rawValue.toFloat()
          Double::class.java -> rawValue.toDouble()
          else -> rawValue
        }
      } else {
        rawValue
      }

      val casted = exceptionDecorator({ cause -> FieldCastException(property.key, property.typeDescriptor, value, cause) }) {
        property.typeConverter.convert(value, context, forceConversion)
      }

      property.setter(instance, casted)
    }

    @Suppress("UNCHECKED_CAST")
    return instance as T
  }
}

class RecordTypeConverter<T : Record>(
  converterProvider: TypeConverterProvider,
  val typeDescriptor: TypeDescriptor
) : DynamicAwareTypeConverters<T>() {
  internal val conversionStrategy: RecordConversionStrategy<T> = if (typeDescriptor.typeInfo.introspection != null) {
    IntrospectableRecordConversionStrategy(converterProvider, typeDescriptor)
  } else {
    Log.w("ExpoModulesCore", "Introspectable data is missing for ${typeDescriptor.jClass}. Falling back to reflection-based conversion, which may have performance implications. To fix this, ensure that the Record class is properly annotated with expo.modules.kotlin.types.Introspectable and that the necessary metadata is available at runtime.")
    ReflectionRecordConversionStrategy(converterProvider, typeDescriptor)
  }

  override fun convertFromDynamic(value: Dynamic, context: AppContext?, forceConversion: Boolean): T =
    exceptionDecorator({ cause -> RecordCastException(typeDescriptor, cause) }) {
      val jsMap = value.asMap() ?: throw DynamicCastException(ReadableMap::class)
      return@exceptionDecorator conversionStrategy.convertFromReadableMap(jsMap, context, forceConversion)
    }

  override fun convertFromAny(value: Any, context: AppContext?, forceConversion: Boolean): T {
    if (value is ReadableMap) {
      return conversionStrategy.convertFromReadableMap(value, context, forceConversion)
    }

    if (value is Map<*, *>) {
      @Suppress("UNCHECKED_CAST")
      return conversionStrategy.convertFromMap(value as Map<String, Any?>, context, forceConversion)
    }

    @Suppress("UNCHECKED_CAST")
    return value as T
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.READABLE_MAP)

  override fun isTrivial(): Boolean = false
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
  return converter.conversionStrategy.convertFromMap(map, null, forceConversion = false)
}

inline fun <reified T : Record> recordFromMap(map: Map<String, Any?>): T {
  val converter = TypeConverterProviderImpl.obtainTypeConverter(typeOf<T>().toTypeDescriptor())
  @Suppress("UNCHECKED_CAST")
  return recordFromMap(map, converter as RecordTypeConverter<T>)
}
