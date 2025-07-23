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
      // We need to enforce conversion here because we can't assume that the type of value passed from C++ is correct.
      // For example, if we convert a `List<String | Int>`, we can't cast it to `List<String>`.
      // When we don't enforce conversion, our code will assume that the data from C++ is correct and
      // will fail later when we try to access a list element.
      typeConverter.convert(value, context, forceConversion = true)
    }
  } catch (_: Throwable) {
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
) : NonNullableTypeConverter<Either<FirstType, SecondType>>() {
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

  // This converter it's always forcing the conversion of children converters - the `forceConversion` is ignored.
  override fun convertNonNullable(value: Any, context: AppContext?, forceConversion: Boolean): Either<FirstType, SecondType> {
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
) : NonNullableTypeConverter<EitherOfThree<FirstType, SecondType, ThirdType>>() {
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

  override fun isTrivial(): Boolean = false

  override fun convertNonNullable(value: Any, context: AppContext?, forceConversion: Boolean): EitherOfThree<FirstType, SecondType, ThirdType> {
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

  override fun getCppRequiredTypes(): ExpectedType =
    ExpectedType.merge(firstType, secondType, thirdType)
}

@EitherType
class EitherOfFourTypeConverter<FirstType : Any, SecondType : Any, ThirdType : Any, FourthType : Any>(
  converterProvider: TypeConverterProvider,
  eitherType: KType
) : NonNullableTypeConverter<EitherOfFour<FirstType, SecondType, ThirdType, FourthType>>() {
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

  override fun isTrivial(): Boolean = false

  override fun convertNonNullable(value: Any, context: AppContext?, forceConversion: Boolean): EitherOfFour<FirstType, SecondType, ThirdType, FourthType> {
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

  override fun getCppRequiredTypes(): ExpectedType =
    ExpectedType.merge(firstType, secondType, thirdType, fourthType)
}
