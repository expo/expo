package expo.modules.imagepicker

import expo.modules.imagepicker.exporters.CompressionImageExporter
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.providers.AppContextProvider
import org.junit.Assert.assertEquals
import org.junit.Test

internal class ImageFileExtensionTest {
  @Test
  fun toImageFileExtension_keepsHeicAndHeif() {
    assertEquals(".heic", "image/heic".toImageFileExtension())
    assertEquals(".heif", "image/heif".toImageFileExtension())
  }

  @Test
  fun withImageFileExtension_replacesTheExtension() {
    assertEquals("IMG_1234.jpeg", "IMG_1234.HEIC".withImageFileExtension("image/jpeg"))
    assertEquals("photo.v2.png", "photo.v2.webp".withImageFileExtension("image/png"))
    assertEquals("photo.jpeg", "photo".withImageFileExtension("image/jpeg"))
  }

  @Test
  fun compressionImageExporter_reportsTheEncodedMimeType() {
    val appContextProvider = object : AppContextProvider {
      override val appContext: AppContext
        get() = throw UnsupportedOperationException()
    }
    val exporter = CompressionImageExporter(appContextProvider, 0.5)

    assertEquals("image/jpeg", exporter.outputMimeType("image/heic"))
    assertEquals("image/jpeg", exporter.outputMimeType("image/webp"))
    assertEquals("image/png", exporter.outputMimeType("image/png"))
  }
}
