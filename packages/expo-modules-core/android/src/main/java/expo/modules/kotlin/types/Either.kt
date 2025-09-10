@file:Suppress("UNCHECKED_CAST")

package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.unwrap
import java.lang.ref.WeakReference
import kotlin.reflect.KClass
import kotlin.reflect.KType

sealed class DeferredValue

data object IncompatibleValue : DeferredValue()

class UnconvertedValue(
  private val unconvertedValue: Any,
  private val typeConverter: TypeConverter<*>,
  context: AppContext?
) : DeferredValue() {
  private val contextHolder = WeakReference(context)

  private var convertedValue: Any? = null

  fun getConvertedValue(): Any {
    if (convertedValue == null) {
      convertedValue = typeConverter.convert(unconvertedValue, contextHolder.get(), forceConversion = true)
    }

    return convertedValue!!
  }
}

data class ConvertedValue(val convertedValue: Any) : DeferredValue()

/**
 * Converts the type T to KClass. It preserves all parameters of type T if it's a generic.
 * For instance, `toKClass<List<String>>() == KClass<List<String>>`
 * Getting `KClass<List<String>>` isn't possible without a helper function because
 * `List<String>::class` isn't a valid syntax.
 */
inline fun <reified T : Any> toKClass(): KClass<T> = T::class

@EitherType
@DoNotStrip
// We can't strip this class because typeOf<Either<T,P>> won't work in the release builds.
open class Either<FirstType : Any, SecondType : Any>(
  private val bareValue: Any,
  private val deferredValue: MutableList<DeferredValue>,
  private val types: List<KType>

) {
  internal fun `is`(index: Int): Boolean {
    return when (val value = deferredValue[index]) {
      is ConvertedValue -> true
      IncompatibleValue -> false
      is UnconvertedValue -> {
        try {
          deferredValue[index] = ConvertedValue(value.getConvertedValue())
          true
        } catch (_: Throwable) {
          deferredValue[index] = IncompatibleValue
          false
        }
      }
    }
  }

  internal fun get(index: Int): Any {
    return when (val value = deferredValue[index]) {
      is ConvertedValue -> value.convertedValue
      IncompatibleValue -> throw TypeCastException("Cannot cast '$bareValue' to '${types[index]}'")
      is UnconvertedValue -> {
        try {
          val convertedValue = value.getConvertedValue()
          deferredValue[index] = ConvertedValue(convertedValue)
          convertedValue
        } catch (e: Throwable) {
          deferredValue[index] = IncompatibleValue
          if (bareValue is Dynamic) {
            throw TypeCastException("Cannot cast '[$bareValue] ${bareValue.unwrap()}' to '${types[index]}' - ${e.message}")
          } else {
            throw TypeCastException("Cannot cast '$bareValue' to '${types[index]}' - ${e.message}")
          }
        }
      }
    }
  }

  @JvmName("isFirstType")
  fun `is`(@Suppress("UNUSED_PARAMETER") type: KClass<FirstType>): Boolean = `is`(0)

  @JvmName("isSecondType")
  fun `is`(@Suppress("UNUSED_PARAMETER") type: KClass<SecondType>): Boolean = `is`(1)

  @JvmName("getFirstType")
  fun get(@Suppress("UNUSED_PARAMETER") type: KClass<FirstType>): FirstType = get(0) as FirstType

  @JvmName("getSecondType")
  fun get(@Suppress("UNUSED_PARAMETER") type: KClass<SecondType>): SecondType = get(1) as SecondType

  fun first(): FirstType = get(0) as FirstType

  fun second(): SecondType = get(1) as SecondType
}

@EitherType
@DoNotStrip
open class EitherOfThree<FirstType : Any, SecondType : Any, ThirdType : Any>(
  bareValue: Any,
  deferredValue: MutableList<DeferredValue>,
  types: List<KType>
) : Either<FirstType, SecondType>(bareValue, deferredValue, types) {
  @JvmName("isThirdType")
  fun `is`(@Suppress("UNUSED_PARAMETER") type: KClass<ThirdType>): Boolean = `is`(2)

  @JvmName("getThirdType")
  fun get(@Suppress("UNUSED_PARAMETER") type: KClass<ThirdType>) = get(2) as ThirdType

  fun third(): ThirdType = get(2) as ThirdType
}

@EitherType
@DoNotStrip
class EitherOfFour<FirstType : Any, SecondType : Any, ThirdType : Any, FourthType : Any>(
  bareValue: Any,
  deferredValue: MutableList<DeferredValue>,
  types: List<KType>
) : EitherOfThree<FirstType, SecondType, ThirdType>(bareValue, deferredValue, types) {
  @JvmName("isFourthType")
  fun `is`(@Suppress("UNUSED_PARAMETER") type: KClass<FourthType>): Boolean = `is`(3)

  @JvmName("getFourthType")
  fun get(@Suppress("UNUSED_PARAMETER") type: KClass<FourthType>): FourthType = get(3) as FourthType

  fun fourth(): FourthType = get(3) as FourthType
}
