package expo.modules.kotlin.records

import kotlin.reflect.KClass
import kotlin.reflect.KType
import kotlin.reflect.full.createType
import kotlin.reflect.full.isSubclassOf

interface ValidationBinder {
  fun bind(annotation: Annotation, fieldType: KType): FieldValidator<*>
}

@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.ANNOTATION_CLASS)
annotation class BindUsing(val binder: KClass<*>)

internal class IntRangeBinder : ValidationBinder {
  override fun bind(annotation: Annotation, fieldType: KType): FieldValidator<*> {
    val rangeAnnotation = annotation as IntRange
    return NumericRangeValidator(
      rangeAnnotation.from,
      rangeAnnotation.to,
      rangeAnnotation.fromInclusive,
      rangeAnnotation.toInclusive
    )
  }
}

internal class LongRangeBinder : ValidationBinder {
  override fun bind(annotation: Annotation, fieldType: KType): FieldValidator<*> {
    val rangeAnnotation = annotation as LongRange
    return NumericRangeValidator(
      rangeAnnotation.from,
      rangeAnnotation.to,
      rangeAnnotation.fromInclusive,
      rangeAnnotation.toInclusive
    )
  }
}

internal class FloatRangeBinder : ValidationBinder {
  override fun bind(annotation: Annotation, fieldType: KType): FieldValidator<*> {
    val rangeAnnotation = annotation as FloatRange
    return NumericRangeValidator(
      rangeAnnotation.from,
      rangeAnnotation.to,
      rangeAnnotation.fromInclusive,
      rangeAnnotation.toInclusive
    )
  }
}

internal class DoubleRangeBinder : ValidationBinder {
  override fun bind(annotation: Annotation, fieldType: KType): FieldValidator<*> {
    val rangeAnnotation = annotation as DoubleRange
    return NumericRangeValidator(
      rangeAnnotation.from,
      rangeAnnotation.to,
      rangeAnnotation.fromInclusive,
      rangeAnnotation.toInclusive
    )
  }
}

internal class IsCollectionNotEmptyBinder : ValidationBinder {
  override fun bind(annotation: Annotation, fieldType: KType): FieldValidator<*> {
    assert(annotation is IsNotEmpty)

    when (fieldType) {
      IntArray::class.createType() -> return IsNotEmptyIntArrayValidator()
      DoubleArray::class.createType() -> return IsNotEmptyDoubleArrayValidator()
      FloatArray::class.createType() -> return IsNotEmptyFloatArrayValidator()
    }

    val kClass = fieldType.classifier as KClass<*>
    if (kClass.isSubclassOf(Array::class) || kClass.java.isArray) {
      return IsNotEmptyArrayValidator()
    }

    return IsNotEmptyCollectionValidator()
  }
}

internal class SizeBinder : ValidationBinder {
  override fun bind(annotation: Annotation, fieldType: KType): FieldValidator<*> {
    val sizeAnnotation = annotation as Size

    when (fieldType) {
      IntArray::class.createType() -> return IntArraySizeValidator(sizeAnnotation.min, sizeAnnotation.max)
      DoubleArray::class.createType() -> return DoubleArraySizeValidator(sizeAnnotation.min, sizeAnnotation.max)
      FloatArray::class.createType() -> return FloatArraySizeValidator(sizeAnnotation.min, sizeAnnotation.max)
    }

    val kClass = fieldType.classifier as KClass<*>

    if (kClass.isSubclassOf(String::class)) {
      return StringSizeValidator(sizeAnnotation.min, sizeAnnotation.max)
    } else if (kClass.isSubclassOf(Array::class) || kClass.java.isArray) {
      return ArraySizeValidator(sizeAnnotation.min, sizeAnnotation.max)
    }

    return CollectionSizeValidator(sizeAnnotation.min, sizeAnnotation.max)
  }
}

internal class RegexBinder : ValidationBinder {
  override fun bind(annotation: Annotation, fieldType: KType): FieldValidator<*> {
    val regexAnnotation = annotation as RegularExpression
    return RegexValidator(regexAnnotation.regex.toRegex())
  }
}
