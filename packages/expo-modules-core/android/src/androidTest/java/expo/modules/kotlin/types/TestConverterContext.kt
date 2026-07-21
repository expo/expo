package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import io.mockk.mockk

internal val testConverterContext = mockk<ConverterContext>(relaxed = true)

internal inline fun <reified T> convert(value: Dynamic): T = convert(value, testConverterContext)
