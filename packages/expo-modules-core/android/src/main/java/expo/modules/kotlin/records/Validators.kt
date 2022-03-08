package expo.modules.kotlin.records

@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.PROPERTY, AnnotationTarget.TYPE, AnnotationTarget.VALUE_PARAMETER)
@BindUsing(IntRangeBinder::class)
annotation class IntRange(val from: Int, val to: Int)

@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.PROPERTY)
@BindUsing(LongRangeBinder::class)
annotation class LongRange(val from: Long, val to: Long)

@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.PROPERTY)
@BindUsing(FloatRangeBinder::class)
annotation class FloatRange(val from: Float, val to: Float)

@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.PROPERTY)
@BindUsing(DoubleRangeBinder::class)
annotation class DoubleRange(val from: Double, val to: Double)
