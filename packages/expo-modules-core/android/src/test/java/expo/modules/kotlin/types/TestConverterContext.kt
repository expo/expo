package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import io.mockk.mockk
import kotlin.reflect.KType

internal val testConverterContext = mockk<ConverterContext>(relaxed = true)

internal inline fun <reified T> convert(value: Dynamic): T = convert(value, testConverterContext)

internal inline fun <reified T> convert(value: Any?): T = convert(value, testConverterContext)

internal fun convert(value: Dynamic, type: KType): Any? = convert(value, type, testConverterContext)

internal fun <T : Any> TypeConverter<T>.convert(value: Any?): T? =
  convert(value, testConverterContext)
