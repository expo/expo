package expo.modules.kotlin.records

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableMap
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.allocators.ObjectConstructor
import expo.modules.kotlin.allocators.ObjectConstructorFactory
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
import kotlin.reflect.full.createInstance
import kotlin.reflect.full.findAnnotation
import kotlin.reflect.full.memberProperties
import kotlin.reflect.jvm.javaField

class RecordTypeConverter<T : Record>(
  private val converterProvider: TypeConverterProvider,
  val type: KType
) : DynamicAwareTypeConverters<T>(type.isMarkedNullable) {
  private val objectConstructorFactory = ObjectConstructorFactory()
  private val propertyDescriptors: Map<KProperty1<out Any, *>, PropertyDescriptor> by lazy {
    (type.classifier as KClass<*>)
      .memberProperties
      .map { property ->
        val fieldAnnotation = property.findAnnotation<Field>() ?: return@map null
        val typeConverter = converterProvider.obtainTypeConverter(property.returnType)

        return@map property to PropertyDescriptor(
          typeConverter,
          fieldAnnotation,
          isRequired = property.findAnnotation<Required>() != null,
          validators = getValidators(property)
        )
      }
      .filterNotNull()
      .toMap()
  }

  override fun convertFromDynamic(value: Dynamic, context: AppContext?): T =
    exceptionDecorator({ cause -> RecordCastException(type, cause) }) {
      val jsMap = value.asMap()
      return convertFromReadableMap(jsMap, context)
    }

  override fun convertFromAny(value: Any, context: AppContext?): T {
    if (value is ReadableMap) {
      return convertFromReadableMap(value, context)
    }

    @Suppress("UNCHECKED_CAST")
    return value as T
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.READABLE_MAP)

  override fun isTrivial(): Boolean = false

  private fun convertFromReadableMap(jsMap: ReadableMap, context: AppContext?): T {
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
            descriptor.typeConverter.convert(this, context)
          }

          if (casted != null) {
            descriptor
              .validators
              .forEach { validator ->
                @Suppress("UNCHECKED_CAST")
                (validator as FieldValidator<Any>).validate(casted)
              }
          }

          javaField.isAccessible = true
          javaField.set(instance, casted)
        }
      }

    @Suppress("UNCHECKED_CAST")
    return instance as T
  }

  private fun <T : Any> getObjectConstructor(clazz: KClass<T>): ObjectConstructor<T> {
    return objectConstructorFactory.get(clazz)
  }

  private fun getValidators(property: KProperty1<out Any, *>): List<FieldValidator<*>> {
    return property
      .annotations
      .map findValidators@{ annotation ->
        val binderAnnotation = annotation.annotationClass.findAnnotation<BindUsing>()
          ?: return@findValidators null
        annotation to binderAnnotation
      }
      .filterNotNull()
      .map { (annotation, binderAnnotation) ->
        val binderInstance = binderAnnotation.binder.createInstance() as ValidationBinder
        binderInstance.bind(annotation, property.returnType)
      }
  }

  private data class PropertyDescriptor(
    val typeConverter: TypeConverter<*>,
    val fieldAnnotation: Field,
    val isRequired: Boolean,
    val validators: List<FieldValidator<*>>
  )
}
