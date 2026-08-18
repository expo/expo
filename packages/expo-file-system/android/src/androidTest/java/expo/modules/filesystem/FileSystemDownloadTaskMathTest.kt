package expo.modules.filesystem

import org.junit.Assert.assertEquals
import org.junit.Test

class FileSystemDownloadTaskMathTest {
  @Test
  fun resumedDownloadWithUnknownContentLengthUsesSentinelTotalBytes() {
    assertEquals(
      -1L,
      calculateDownloadTotalBytes(
        responseCode = 206,
        contentLength = -1L,
        effectiveOffset = 128L
      )
    )
  }
}
