package expo.modules.sharing

import android.content.ContentResolver
import android.content.Context
import android.content.Intent
import android.database.MatrixCursor
import android.net.Uri
import android.provider.OpenableColumns
import io.mockk.every
import io.mockk.mockk
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File
import java.net.URI

@RunWith(RobolectricTestRunner::class)
class ResolvingShareIntentDataParserTest {
  @get:Rule
  val tempFolder = TemporaryFolder()

  @Test
  fun `parse should copy a shared file into the cache directory when its display name contains a relative path`() {
    val dataDirectory = tempFolder.root
    val cacheDirectory = File(dataDirectory, "cache").apply { mkdir() }
    val uri = Uri.parse("content://com.example.provider/shared")
    val resolver = mockk<ContentResolver> {
      every { query(uri, null, null, null, null) } answers {
        MatrixCursor(arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE)).apply {
          addRow(arrayOf("../escaped.png", 4L))
        }
      }
      every { getType(uri) } returns "image/png"
      every { openInputStream(uri) } answers { "test".byteInputStream() }
    }
    val context = mockk<Context> {
      every { contentResolver } returns resolver
      every { cacheDir } returns cacheDirectory
    }
    val intent = Intent(Intent.ACTION_SEND)
      .setType("image/png")
      .putExtra(Intent.EXTRA_STREAM, uri)

    val payload = ResolvingShareIntentDataParser.parse(context, intent).single()

    val copiedFile = File(URI(payload.contentUri))
    assertFalse(File(dataDirectory, "escaped.png").exists())
    assertTrue(copiedFile.canonicalPath.startsWith(cacheDirectory.canonicalPath + File.separator))
    assertEquals("test", copiedFile.readText())
    assertEquals("escaped.png", payload.originalName)
  }
}
