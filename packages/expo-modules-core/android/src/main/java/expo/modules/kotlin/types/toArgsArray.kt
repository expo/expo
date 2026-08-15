package expo.modules.kotlin.types

@Suppress("UNUSED_PARAMETER")
inline fun <reified P0> toArgsArray(
  p0: Class<P0> = P0::class.java,
  converterProvider: TypeConverterProvider? = null
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>(converterProvider)
  )
}

@Suppress("UNUSED_PARAMETER")
inline fun <reified P0, reified P1> toArgsArray(
  p0: Class<P0> = P0::class.java,
  p1: Class<P1> = P1::class.java,
  converterProvider: TypeConverterProvider? = null
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>(converterProvider),
    toAnyType<P1>(converterProvider)
  )
}

@Suppress("UNUSED_PARAMETER")
inline fun <reified P0, reified P1, reified P2> toArgsArray(
  p0: Class<P0> = P0::class.java,
  p1: Class<P1> = P1::class.java,
  p2: Class<P2> = P2::class.java,
  converterProvider: TypeConverterProvider? = null
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>(converterProvider),
    toAnyType<P1>(converterProvider),
    toAnyType<P2>(converterProvider)
  )
}

@Suppress("UNUSED_PARAMETER")
inline fun <reified P0, reified P1, reified P2, reified P3> toArgsArray(
  p0: Class<P0> = P0::class.java,
  p1: Class<P1> = P1::class.java,
  p2: Class<P2> = P2::class.java,
  p3: Class<P3> = P3::class.java,
  converterProvider: TypeConverterProvider? = null
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>(converterProvider),
    toAnyType<P1>(converterProvider),
    toAnyType<P2>(converterProvider),
    toAnyType<P3>(converterProvider)
  )
}

@Suppress("UNUSED_PARAMETER")
inline fun <reified P0, reified P1, reified P2, reified P3, reified P4> toArgsArray(
  p0: Class<P0> = P0::class.java,
  p1: Class<P1> = P1::class.java,
  p2: Class<P2> = P2::class.java,
  p3: Class<P3> = P3::class.java,
  p4: Class<P4> = P4::class.java,
  converterProvider: TypeConverterProvider? = null
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>(converterProvider),
    toAnyType<P1>(converterProvider),
    toAnyType<P2>(converterProvider),
    toAnyType<P3>(converterProvider),
    toAnyType<P4>(converterProvider)
  )
}

@Suppress("UNUSED_PARAMETER")
inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> toArgsArray(
  p0: Class<P0> = P0::class.java,
  p1: Class<P1> = P1::class.java,
  p2: Class<P2> = P2::class.java,
  p3: Class<P3> = P3::class.java,
  p4: Class<P4> = P4::class.java,
  p5: Class<P5> = P5::class.java,
  converterProvider: TypeConverterProvider? = null
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>(converterProvider),
    toAnyType<P1>(converterProvider),
    toAnyType<P2>(converterProvider),
    toAnyType<P3>(converterProvider),
    toAnyType<P4>(converterProvider),
    toAnyType<P5>(converterProvider)
  )
}

@Suppress("UNUSED_PARAMETER")
inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> toArgsArray(
  p0: Class<P0> = P0::class.java,
  p1: Class<P1> = P1::class.java,
  p2: Class<P2> = P2::class.java,
  p3: Class<P3> = P3::class.java,
  p4: Class<P4> = P4::class.java,
  p5: Class<P5> = P5::class.java,
  p6: Class<P6> = P6::class.java,
  converterProvider: TypeConverterProvider? = null
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>(converterProvider),
    toAnyType<P1>(converterProvider),
    toAnyType<P2>(converterProvider),
    toAnyType<P3>(converterProvider),
    toAnyType<P4>(converterProvider),
    toAnyType<P5>(converterProvider),
    toAnyType<P6>(converterProvider)
  )
}

@Suppress("UNUSED_PARAMETER")
inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> toArgsArray(
  p0: Class<P0> = P0::class.java,
  p1: Class<P1> = P1::class.java,
  p2: Class<P2> = P2::class.java,
  p3: Class<P3> = P3::class.java,
  p4: Class<P4> = P4::class.java,
  p5: Class<P5> = P5::class.java,
  p6: Class<P6> = P6::class.java,
  p7: Class<P7> = P7::class.java,
  converterProvider: TypeConverterProvider? = null
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>(converterProvider),
    toAnyType<P1>(converterProvider),
    toAnyType<P2>(converterProvider),
    toAnyType<P3>(converterProvider),
    toAnyType<P4>(converterProvider),
    toAnyType<P5>(converterProvider),
    toAnyType<P6>(converterProvider),
    toAnyType<P7>(converterProvider)
  )
}
