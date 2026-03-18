package expo.modules.asset

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File
import java.security.MessageDigest

@RunWith(RobolectricTestRunner::class)
class FileUtilsTest {
  @Test
  fun `getMD5HashOfFileContent should return correct MD5 hash for file content`() {
    val content = "hello world"
    val tempFile = File.createTempFile("test-asset", ".txt").apply {
      deleteOnExit()
      writeText(content)
    }

    val expected = MessageDigest.getInstance("MD5")
      .digest(content.toByteArray())
      .joinToString("") { "%02x".format(it) }

    val result = getMD5HashOfFileContent(tempFile)

    assertNotNull(result)
    assertEquals(expected, result)
  }
}
