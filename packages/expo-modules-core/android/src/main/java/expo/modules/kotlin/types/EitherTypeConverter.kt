package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.jni.ExpectedType
import kotlin.reflect.KType

private fun createDeferredValue(
  value: Any,
  wasConverted: Boolean,
  typeConverter: TypeConverter<*>,
  expectedType: ExpectedType,
  context: AppContext?
): DeferredValue {
  for (type in expectedType.getPossibleTypes()) {
    if (wasConverted) {
      return UnconvertedValue(value, typeConverter, context)
    }

    if (type.expectedCppType.clazz.isInstance(value) || value is Dynamic) {
      val convertedValue = tryToConvert(typeConverter, value, context) ?: continue
      return ConvertedValue(convertedValue)
    }
  }

  return IncompatibleValue
}

private fun tryToConvert(typeConverter: TypeConverter<*>, value: Any, context: AppContext?): Any? {
  return try {
    if (typeConverter.isTrivial() && value !is Dynamic) {
      value
    } else {
      typeConverter.convert(value, context)
    }
  } catch (e: Throwable) {
    null
  }
}

private fun createDeferredValues(
  value: Any,
  context: AppContext?,
  list: List<Pair<ExpectedType, TypeConverter<*>>>,
  typeList: List<KType>
): List<DeferredValue> {
  var wasConverted = false
  val result = list.map { (expectedType, converter) ->
    val deferredValue = createDeferredValue(value, wasConverted, converter, expectedType, context)
    if (deferredValue is ConvertedValue) {
      wasConverted = true
    }

    deferredValue
  }

  if (!wasConverted) {
    throw TypeCastException("Cannot cast '$value' to 'Either<${typeList.joinToString(separator = ", ") { it.toString() }}>'")
  }

  return result
}

@EitherType
class EitherTypeConverter<FirstType : Any, SecondType : Any>(
  converterProvider: TypeConverterProvider,
  eitherType: KType
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
    val typeList = listOf(firstJavaType, secondJavaType)

    val deferredValues = createDeferredValues(
      value,
      context,
      listOf(
        firstType to firstTypeConverter,
        secondType to secondTypeConverter
      ),
      typeList
    )

    return Either(
      value,
      deferredValues.toMutableList(),
      typeList
    )
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType.merge(firstType, secondType)

  override fun isTrivial(): Boolean = false
}

@EitherType
class EitherOfThreeTypeConverter<FirstType : Any, SecondType : Any, ThirdType : Any>(
  converterProvider: TypeConverterProvider,
  eitherType: KType
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
    val typeList = listOf(firstJavaType, secondJavaType, thirdJavaType)
    val deferredValues = createDeferredValues(
      value,
      context,
      listOf(
        firstType to firstTypeConverter,
        secondType to secondTypeConverter,
        thirdType to thirdTypeConverter
      ),
      typeList
    )

    return EitherOfThree(
      value,
      deferredValues.toMutableList(),
      typeList
    )
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType.merge(firstType, secondType, thirdType)
}

@EitherType
class EitherOfFourTypeConverter<FirstType : Any, SecondType : Any, ThirdType : Any, FourthType : Any>(
  converterProvider: TypeConverterProvider,
  eitherType: KType
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
    val typeList = listOf(firstJavaType, secondJavaType, thirdJavaType, fourthJavaType)
    val deferredValues = createDeferredValues(
      value,
      context,
      listOf(
        firstType to firstTypeConverter,
        secondType to secondTypeConverter,
        thirdType to thirdTypeConverter,
        fourthType to fourthTypeConverter
      ),
      listOf(firstJavaType, secondJavaType, thirdJavaType, fourthJavaType)
    )

    return EitherOfFour(
      value,
      deferredValues.toMutableList(),
      typeList
    )
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType.merge(firstType, secondType, thirdType, fourthType)
}
