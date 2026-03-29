package expo.modules.filesystem

import android.content.Context
import androidx.documentfile.provider.DocumentFile
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.test.core.withMockAppContext
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.net.URI

class FileSystemDownloadTaskTest {
  private val context: Context
    get() = InstrumentationRegistry.getInstrumentation().targetContext

  private fun getSAFRootDir(): DocumentFile {
    val safRootUri = android.provider.DocumentsContract.buildTreeDocumentUri(
      TestStorageProvider.AUTHORITY,
      TestStorageProvider.ROOT_DOC_ID
    )
    return DocumentFile.fromTreeUri(context, safRootUri)!!.apply {
      listFiles().forEach { it.delete() }
    }
  }

  @Test
  fun filenameFallbackUsesDownloadWhenUrlHasNoFilename() {
    assertEquals("download", filenameFromUrl(URI("https://example.com/")))
  }

  @Test
  fun resolveDownloadDestinationCreatesSafChildFile() {
    val safRootDir = getSAFRootDir()
    val destinationDir = FileSystemDirectory(safRootDir.uri).withMockAppContext()

    val downloadedFile = resolveDownloadDestination(destinationDir, URI("https://example.com/payload.txt"))

    assertEquals("payload.txt", downloadedFile.fileName)
    assertTrue(downloadedFile.isFile())
    val safChild = safRootDir.findFile("payload.txt")
    assertNotNull(safChild)
  }
}
