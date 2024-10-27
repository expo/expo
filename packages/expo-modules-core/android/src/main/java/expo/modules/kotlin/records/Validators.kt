package expo.modules.kotlin.records

@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.PROPERTY, AnnotationTarget.TYPE, AnnotationTarget.VALUE_PARAMETER)
@BindUsing(IntRangeBinder::class)
annotation class IntRange(
  val from: Int,
  val to: Int,
  val fromInclusive: Boolean = true,
  val toInclusive: Boolean = true
)

@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.PROPERTY)
@BindUsing(LongRangeBinder::class)
annotation class LongRange(
  val from: Long,
  val to: Long,
  val fromInclusive: Boolean = true,
  val toInclusive: Boolean = true
)

@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.PROPERTY)
@BindUsing(FloatRangeBinder::class)
annotation class FloatRange(
  val from: Float,
  val to: Float,
  val fromInclusive: Boolean = true,
  val toInclusive: Boolean = true
)

@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.PROPERTY)
@BindUsing(DoubleRangeBinder::class)
annotation class DoubleRange(
  val from: Double,
  val to: Double,
  val fromInclusive: Boolean = true,
  val toInclusive: Boolean = true
)

@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.PROPERTY)
@BindUsing(IsCollectionNotEmptyBinder::class)
annotation class IsNotEmpty

@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.PROPERTY)
@BindUsing(SizeBinder::class)
annotation class Size(
  val min: Int = 0,
  val max: Int = Int.MAX_VALUE
)

@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.PROPERTY)
@BindUsing(RegexBinder::class)
annotation class RegularExpression(
  val regex: String
)
