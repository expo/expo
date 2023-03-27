package expo.modules.kotlin.types

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.jni.SingleType
import kotlin.reflect.KType

@EitherType
class EitherTypeConverter<FirstType : Any, SecondType : Any>(
  converterProvider: TypeConverterProvider,
  eitherType: KType,
) : NullAwareTypeConverter<Either<FirstType, SecondType>>(eitherType.isMarkedNullable) {
  private val firstJavaType = requireNotNull(eitherType.arguments.getOrNull(0)?.type)
  private val secondJavaType = requireNotNull(eitherType.arguments.getOrNull(1)?.type)
  private val firstTypeConverter = converterProvider.obtainTypeConverter(
    firstJavaType
  )
  private val secondTypeConverter = converterProvider.obtainTypeConverter(
    secondJavaType
  )
  private val firstType = firstTypeConverter.getCppRequiredTypes()
  private val secondType = secondTypeConverter.getCppRequiredTypes()

  override fun convertNonOptional(value: Any, context: AppContext?): Either<FirstType, SecondType> {
    val convertValueIfNeeded = Convert@{ types: Array<out SingleType>, converter: TypeConverter<*> ->
      for (singleType in types) {
        if (singleType.expectedCppType.clazz.isInstance(value)) {
          return@Convert if (firstTypeConverter.isTrivial()) {
            Either<FirstType, SecondType>(value)
          } else {
            Either(converter.convert(value)!!)
          }
        }
      }
      null
    }

    return convertValueIfNeeded(
      firstType.getPossibleTypes(),
      firstTypeConverter
    ) ?: convertValueIfNeeded(
      secondType.getPossibleTypes(),
      secondTypeConverter
    )
      ?: throw TypeCastException("Cannot cast '$value' to 'Either<$firstJavaType, $secondJavaType>'")
  }

  override fun getCppRequiredTypes(): ExpectedType = firstType + secondType

  override fun isTrivial(): Boolean = false
}

@EitherType
class EitherOfThreeTypeConverter<FirstType : Any, SecondType : Any, ThirdType : Any>(
  converterProvider: TypeConverterProvider,
  eitherType: KType,
) : NullAwareTypeConverter<EitherOfThree<FirstType, SecondType, ThirdType>>(eitherType.isMarkedNullable) {
  private val firstJavaType = requireNotNull(eitherType.arguments.getOrNull(0)?.type)
  private val secondJavaType = requireNotNull(eitherType.arguments.getOrNull(1)?.type)
  private val thirdJavaType = requireNotNull(eitherType.arguments.getOrNull(2)?.type)
  private val firstTypeConverter = converterProvider.obtainTypeConverter(
    firstJavaType
  )
  private val secondTypeConverter = converterProvider.obtainTypeConverter(
    secondJavaType
  )
  private val thirdTypeConverter = converterProvider.obtainTypeConverter(
    thirdJavaType
  )
  private val firstType = firstTypeConverter.getCppRequiredTypes()
  private val secondType = secondTypeConverter.getCppRequiredTypes()
  private val thirdType = thirdTypeConverter.getCppRequiredTypes()

  override fun convertNonOptional(value: Any, context: AppContext?): EitherOfThree<FirstType, SecondType, ThirdType> {
    val convertValueIfNeeded = Convert@{ types: Array<out SingleType>, converter: TypeConverter<*> ->
      for (singleType in types) {
        if (singleType.expectedCppType.clazz.isInstance(value)) {
          return@Convert if (firstTypeConverter.isTrivial()) {
            EitherOfThree<FirstType, SecondType, ThirdType>(value)
          } else {
            EitherOfThree(converter.convert(value)!!)
          }
        }
      }
      null
    }

    return convertValueIfNeeded(
      firstType.getPossibleTypes(),
      firstTypeConverter
    ) ?: convertValueIfNeeded(
      secondType.getPossibleTypes(),
      secondTypeConverter
    ) ?: convertValueIfNeeded(
      thirdType.getPossibleTypes(),
      thirdTypeConverter
    )
      ?: throw TypeCastException("Cannot cast '$value' to 'EitherOfThree<$firstJavaType, $secondJavaType, $thirdJavaType>'")
  }

  override fun getCppRequiredTypes(): ExpectedType = firstType + secondType + thirdType
}

@EitherType
class EitherOfFourTypeConverter<FirstType : Any, SecondType : Any, ThirdType : Any, FourthType : Any>(
  converterProvider: TypeConverterProvider,
  eitherType: KType,
) : NullAwareTypeConverter<EitherOfFour<FirstType, SecondType, ThirdType, FourthType>>(eitherType.isMarkedNullable) {
  private val firstJavaType = requireNotNull(eitherType.arguments.getOrNull(0)?.type)
  private val secondJavaType = requireNotNull(eitherType.arguments.getOrNull(1)?.type)
  private val thirdJavaType = requireNotNull(eitherType.arguments.getOrNull(2)?.type)
  private val fourthJavaType = requireNotNull(eitherType.arguments.getOrNull(3)?.type)
  private val firstTypeConverter = converterProvider.obtainTypeConverter(
    firstJavaType
  )
  private val secondTypeConverter = converterProvider.obtainTypeConverter(
    secondJavaType
  )
  private val thirdTypeConverter = converterProvider.obtainTypeConverter(
    thirdJavaType
  )
  private val fourthTypeConverter = converterProvider.obtainTypeConverter(
    fourthJavaType
  )
  private val firstType = firstTypeConverter.getCppRequiredTypes()
  private val secondType = secondTypeConverter.getCppRequiredTypes()
  private val thirdType = thirdTypeConverter.getCppRequiredTypes()
  private val fourthType = fourthTypeConverter.getCppRequiredTypes()

  override fun convertNonOptional(value: Any, context: AppContext?): EitherOfFour<FirstType, SecondType, ThirdType, FourthType> {
    val convertValueIfNeeded = Convert@{ types: Array<out SingleType>, converter: TypeConverter<*> ->
      for (singleType in types) {
        if (singleType.expectedCppType.clazz.isInstance(value)) {
          return@Convert if (firstTypeConverter.isTrivial()) {
            EitherOfFour<FirstType, SecondType, ThirdType, FourthType>(value)
          } else {
            EitherOfFour(converter.convert(value)!!)
          }
        }
      }
      null
    }

    return convertValueIfNeeded(
      firstType.getPossibleTypes(),
      firstTypeConverter
    ) ?: convertValueIfNeeded(
      secondType.getPossibleTypes(),
      secondTypeConverter
    ) ?: convertValueIfNeeded(
      thirdType.getPossibleTypes(),
      thirdTypeConverter
    ) ?: convertValueIfNeeded(
      fourthType.getPossibleTypes(),
      fourthTypeConverter
    )
      ?: throw TypeCastException("Cannot cast '$value' to 'EitherOfFourth<$firstJavaType, $secondJavaType, $thirdJavaType, $fourthJavaType>'")
  }

  override fun getCppRequiredTypes(): ExpectedType = firstType + secondType + thirdType
}
