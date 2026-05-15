package expo.modules.filesystem

import android.net.Uri
import android.os.Build
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [Build.VERSION_CODES.R])
class FileSystemFileTest {
  @Test
  fun createRejectsContentUriBeforeResolvingFileType() {
    val file = FileSystemFile(Uri.parse("content://com.android.externalstorage.documents/tree/primary%3ADownload"))

    val exception = assertThrows(UnableToCreateException::class.java) {
      file.create()
    }

    assertTrue(
      exception.message?.contains("File.create") == true &&
        exception.message?.contains("Directory.createFile") == true
    )
  }
}
