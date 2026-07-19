package expo.modules.filesystem

import android.content.Context
import androidx.core.net.toUri
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.filesystem.unifiedfile.JavaFile
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class FileSystemUploadTaskMathTest {
  private val context: Context
    get() = InstrumentationRegistry.getInstrumentation().targetContext

  @Test
  fun multipartRequestBodyLengthIncludesParametersAndBoundaries() {
    val sourceFile = File.createTempFile("upload", ".txt", context.cacheDir).apply {
      writeText("abcdef")
    }
    val source = JavaFile(sourceFile.toUri())
    val options = UploadTaskOptions().apply {
      fieldName = "payload"
      mimeType = "text/plain"
      parameters = mapOf("token" to "abc")
    }

    val requestBody = createMultipartRequestBody(source, options)
    val expectedBody = MultipartBody.Builder()
      .setType(MultipartBody.FORM)
      .addFormDataPart("token", "abc")
      .addFormDataPart(
        "payload",
        sourceFile.name,
        sourceFile.asRequestBody("text/plain".toMediaTypeOrNull())
      )
      .build()

    assertEquals(expectedBody.contentLength(), requestBody.contentLength())
    assertTrue(requestBody.contentLength() > sourceFile.length())
  }
}
