package expo.modules.filesystem.legacy

import android.os.Build
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.io.ByteArrayInputStream

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [Build.VERSION_CODES.R])
class FileSystemLegacyReaderTest {
  @Test
  fun readsUtf8ByteRange() {
    val result = readInputStreamAsString(
      inputStream = ByteArrayInputStream("alpha beta gamma".toByteArray(Charsets.UTF_8)),
      encoding = EncodingType.UTF8,
      options = ReadingOptions(encoding = EncodingType.UTF8, position = 6, length = 4)
    )

    assertEquals("beta", result)
  }

  @Test
  fun readsFullUtf8StringWithoutByteRange() {
    val result = readInputStreamAsString(
      inputStream = ByteArrayInputStream("alpha beta".toByteArray(Charsets.UTF_8)),
      encoding = EncodingType.UTF8,
      options = ReadingOptions(encoding = EncodingType.UTF8, position = null, length = null)
    )

    assertEquals("alpha beta", result)
  }

  @Test
  fun keepsBase64ByteRangeBehavior() {
    val result = readInputStreamAsString(
      inputStream = ByteArrayInputStream("alpha beta gamma".toByteArray(Charsets.UTF_8)),
      encoding = EncodingType.BASE64,
      options = ReadingOptions(encoding = EncodingType.BASE64, position = 6, length = 4)
    )

    assertEquals("YmV0YQ==", result)
  }

  @Test
  fun returnsEmptyStringWhenByteRangeStartsAfterEndOfStream() {
    val result = readInputStreamAsString(
      inputStream = ByteArrayInputStream("alpha".toByteArray(Charsets.UTF_8)),
      encoding = EncodingType.UTF8,
      options = ReadingOptions(encoding = EncodingType.UTF8, position = 10, length = 5)
    )

    assertEquals("", result)
  }
}
