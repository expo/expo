package expo.modules.kotlin.records

import kotlin.reflect.KClass

interface ValidationBinder {
  fun bind(annotation: Annotation): FieldValidator<*>
}

@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.ANNOTATION_CLASS)
annotation class BindUsing(val binder: KClass<*>)

internal class IntRangeBinder : ValidationBinder {
  override fun bind(annotation: Annotation): FieldValidator<*> {
    val rangeAnnotation = annotation as IntRange
    return NumericRangeValidator(rangeAnnotation.from, rangeAnnotation.to)
  }
}

internal class LongRangeBinder : ValidationBinder {
  override fun bind(annotation: Annotation): FieldValidator<*> {
    val rangeAnnotation = annotation as LongRange
    return NumericRangeValidator(rangeAnnotation.from, rangeAnnotation.to)
  }
}

internal class FloatRangeBinder : ValidationBinder {
  override fun bind(annotation: Annotation): FieldValidator<*> {
    val rangeAnnotation = annotation as FloatRange
    return NumericRangeValidator(rangeAnnotation.from, rangeAnnotation.to)
  }
}

internal class DoubleRangeBinder : ValidationBinder {
  override fun bind(annotation: Annotation): FieldValidator<*> {
    val rangeAnnotation = annotation as DoubleRange
    return NumericRangeValidator(rangeAnnotation.from, rangeAnnotation.to)
  }
}
