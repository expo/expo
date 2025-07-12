package expo.modules.imagepicker.exporters

import android.content.ContentResolver
import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Environment
import android.provider.MediaStore
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.imagepicker.MediaType
import org.junit.Assert
import org.junit.Test
import java.io.File
import java.io.FileInputStream


class DateExporterTests {
  @Test

  /* Creates an image to the media store and use the DateExporter to check that the retrieved date is the same. */
  fun return_media_date_from_mediaStore() {
    val expectedDate = 300L
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val exporter = DateExporter()
    val temporaryFile = copyAssetToTempFile("landscape_0.jpg", context)
    val temporaryFileUri = insertImageInMediaStore(context, temporaryFile, expectedDate)
    if (temporaryFileUri == null) {
      Assert.fail()
    } else {
      val date = exporter.date(context.contentResolver, temporaryFileUri, MediaType.IMAGE)
      Assert.assertEquals(date, expectedDate)
    }
  }

  private fun insertImageInMediaStore(context: Context, file: File, dateTakenMillis: Long) : Uri? {
    val values = ContentValues()
    values.put(MediaStore.Images.Media.DISPLAY_NAME, "landscape_0.jpg")
    values.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
    values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES)
    values.put(MediaStore.Images.Media.DATE_TAKEN, dateTakenMillis)

    val resolver: ContentResolver = context.getContentResolver()
    val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)

    uri?.let {
      resolver.openOutputStream(uri).use { out ->
        if (out != null) {
          FileInputStream(file).use { `in` ->
            val buffer = ByteArray(file.length().toInt())
            var bytesRead: Int
            while ((`in`.read(buffer).also { bytesRead = it }) != -1) {
              out.write(buffer, 0, bytesRead)
            }
          }
        }
      }
    }

    return uri
  }

}

