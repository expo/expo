package expo.modules.kotlin.views

import android.content.Context
import android.view.View
import expo.modules.assertThrows
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.types.ConverterContext
import expo.modules.kotlin.types.descriptors.typeDescriptorOf
import io.mockk.mockk
import org.junit.Test

internal class ViewTypeConverterTest {
  @Test
  fun `throws RuntimeLost when the converter context has no runtime`() {
    val converterContext = object : ConverterContext {
      override val applicationContext = mockk<Context>()
      override val runtime = null

      override fun assertMainThread() = Unit
    }
    val converter = ViewTypeConverter<View>(typeDescriptorOf<View>())

    assertThrows<Exceptions.RuntimeLost> {
      converter.convert(1, converterContext)
    }
  }
}
