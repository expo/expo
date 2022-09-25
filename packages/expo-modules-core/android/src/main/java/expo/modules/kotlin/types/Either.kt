@file:Suppress("UNCHECKED_CAST")

package expo.modules.kotlin.types

import expo.modules.kotlin.apifeatures.EitherType
import kotlin.reflect.KClass

@EitherType
open class Either<FirstType : Any, SecondType : Any>(
  @PublishedApi
  internal val value: Any
) {
  @JvmName("isFirstType")
  fun `is`(type: KClass<FirstType>): Boolean {
    return type.isInstance(value)
  }

  @JvmName("isSecondType")
  fun `is`(type: KClass<SecondType>): Boolean {
    return type.isInstance(value)
  }

  @JvmName("getFirstType")
  fun get(type: KClass<FirstType>) = value as FirstType

  @JvmName("getSecondType")
  fun get(type: KClass<SecondType>) = value as SecondType

  fun first() = value as FirstType

  fun second() = value as SecondType
}

@EitherType
open class EitherOfThree<FirstType : Any, SecondType : Any, ThirdType : Any>(
  value: Any
) : Either<FirstType, SecondType>(value) {
  @JvmName("isThirdType")
  fun `is`(type: KClass<ThirdType>): Boolean {
    return type.isInstance(value)
  }

  @JvmName("getThirdType")
  fun get(type: KClass<ThirdType>) = value as ThirdType

  fun third() = value as ThirdType
}

@EitherType
class EitherOfFour<FirstType : Any, SecondType : Any, ThirdType : Any, FourthType : Any>(
  value: Any
) : EitherOfThree<FirstType, SecondType, ThirdType>(value) {
  @JvmName("isFourthType")
  fun `is`(type: KClass<FourthType>): Boolean {
    return type.isInstance(value)
  }

  @JvmName("getFourthType")
  fun get(type: KClass<FourthType>) = value as FourthType

  fun fourth() = value as FourthType
}
