package expo.modules.updates.loader

import android.net.Uri
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.manifest.UpdateManifest
import io.mockk.every
import io.mockk.mockk
import okhttp3.*
import okio.Buffer
import org.json.JSONException
import org.json.JSONObject
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4ClassRunner::class)
class FileDownloaderManifestParsingTest {
  private val classicJSON = "{\"sdkVersion\":\"39.0.0\",\"releaseId\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"commitTime\":\"2020-11-11T00:17:54.797Z\",\"bundleUrl\":\"https://url.to/bundle.js\"}"

  @Test
  @Throws(JSONException::class)
  fun testManifestParsing_JSONBody() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val contentType = "application/json"
    val response = mockk<Response>().apply {
      every { header("content-type") } returns contentType
      every { headers() } returns Headers.of(mapOf("content-type" to contentType))
      every { body() } returns ResponseBody.create(MediaType.parse("application/json; charset=utf-8"), classicJSON)
    }

    val configuration = UpdatesConfiguration().loadValuesFromMap(mapOf(
      "updateUrl" to Uri.parse("https://exp.host/@test/test"),
    ))

    var errorOccurred = false
    var resultUpdateManifest: UpdateManifest? = null

    FileDownloader(context).parseManifestResponse(response, configuration, object : FileDownloader.ManifestDownloadCallback {
      override fun onFailure(message: String, e: Exception) {
        errorOccurred = true
      }

      override fun onSuccess(updateManifest: UpdateManifest) {
        resultUpdateManifest = updateManifest
      }
    })

    Assert.assertFalse(errorOccurred)
    Assert.assertNotNull(resultUpdateManifest)
  }

  @Test
  @Throws(JSONException::class)
  fun testManifestParsing_MultipartBody() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val boundary = "blah"
    val contentType = "multipart/mixed; boundary=$boundary"

    val multipartBody = MultipartBody.Builder(boundary)
      .setType(MultipartBody.MIXED)
      .addPart(
        Headers.of(mapOf("Content-Disposition" to "form-data; name=\"manifest\"")),
        RequestBody.create(MediaType.parse("application/json; charset=utf-8"), classicJSON)
      )
      .build()

    val contentBuffer = Buffer().also { multipartBody.writeTo(it) }

    val response = mockk<Response>().apply {
      every { header("content-type") } returns contentType
      every { headers() } returns Headers.of(mapOf("content-type" to contentType))
      every { body() } returns ResponseBody.create(MultipartBody.MIXED, contentBuffer.readByteArray())
    }

    val configuration = UpdatesConfiguration().loadValuesFromMap(mapOf(
      "updateUrl" to Uri.parse("https://exp.host/@test/test"),
    ))

    var errorOccurred = false
    var resultUpdateManifest: UpdateManifest? = null

    FileDownloader(context).parseManifestResponse(response, configuration, object : FileDownloader.ManifestDownloadCallback {
      override fun onFailure(message: String, e: Exception) {
        errorOccurred = true
      }

      override fun onSuccess(updateManifest: UpdateManifest) {
        resultUpdateManifest = updateManifest
      }
    })

    Assert.assertFalse(errorOccurred)
    Assert.assertNotNull(resultUpdateManifest)
  }
}