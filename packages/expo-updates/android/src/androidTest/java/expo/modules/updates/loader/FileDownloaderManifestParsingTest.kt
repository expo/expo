package expo.modules.updates.loader

import android.net.Uri
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.manifest.UpdateManifest
import io.mockk.every
import io.mockk.mockk
import okhttp3.*
import okhttp3.Headers.Companion.toHeaders
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okio.Buffer
import org.json.JSONException
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith

private const val classicJSON = "{\"sdkVersion\":\"39.0.0\",\"releaseId\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"commitTime\":\"2020-11-11T00:17:54.797Z\",\"bundleUrl\":\"https://url.to/bundle.js\"}"

private const val newJSON = "{\"id\":\"0754dad0-d200-d634-113c-ef1f26106028\",\"createdAt\":\"2021-11-23T00:57:14.437Z\",\"runtimeVersion\":\"1\",\"assets\":[{\"hash\":\"cb65fafb5ed456fc3ed8a726cf4087d37b875184eba96f33f6d99104e6e2266d\",\"key\":\"489ea2f19fa850b65653ab445637a181.jpg\",\"contentType\":\"image/jpeg\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/assets/489ea2f19fa850b65653ab445637a181&runtimeVersion=1&platform=android\",\"fileExtension\":\".jpg\"}],\"launchAsset\":{\"hash\":\"323ddd1968ee76d4ddbb16b04fb2c3f1b6d1ab9b637d819699fecd6fa0ffb1a8\",\"key\":\"696a70cf7035664c20ea86f67dae822b.bundle\",\"contentType\":\"application/javascript\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/bundles/android-696a70cf7035664c20ea86f67dae822b.js&runtimeVersion=1&platform=android\",\"fileExtension\":\".bundle\"}}"
private const val newJSONCertificate = "-----BEGIN CERTIFICATE-----\nMIIDfzCCAmegAwIBAgIJLGiqnjmA9JmpMA0GCSqGSIb3DQEBCwUAMGkxFDASBgNV\nBAMTC2V4YW1wbGUub3JnMQswCQYDVQQGEwJVUzERMA8GA1UECBMIVmlyZ2luaWEx\nEzARBgNVBAcTCkJsYWNrc2J1cmcxDTALBgNVBAoTBFRlc3QxDTALBgNVBAsTBFRl\nc3QwHhcNMjExMTIyMTc0NzQzWhcNMjIxMTIyMTc0NzQzWjBpMRQwEgYDVQQDEwtl\neGFtcGxlLm9yZzELMAkGA1UEBhMCVVMxETAPBgNVBAgTCFZpcmdpbmlhMRMwEQYD\nVQQHEwpCbGFja3NidXJnMQ0wCwYDVQQKEwRUZXN0MQ0wCwYDVQQLEwRUZXN0MIIB\nIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAucg/fRwgYLxO4fDG1W/ew4Wu\nkqp2+j9mLyA18sd8noCT0eSJwxMTLJJq4biNx6kJEVSQdodN3e/qSJndz+ZHA7b1\n6Do3Ecg5oRvl3HEwaH4AkM2Lj87VjgfxPUsiSHtPd+RTbxnOy9lGupQa/j71WrAq\nzJpNmhP70vzkY4EVejn52kzRPZB3kTxkjggFrG/f18Bcf4VYxN3aLML32jih+UC0\n6fv57HNZZ3ewGSJrLcUdEgctBWiz1gzwF6YdXtEJ14eQbgHgsLsXaEQeg2ncGGxF\n/3rIhsnlWjeIIya7TS0nvqZHNKznZV9EWpZQBFVoLGGrvOdU3pTmP39qbmY0nwID\nAQABoyowKDAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwMw\nDQYJKoZIhvcNAQELBQADggEBAALcH9Jb3wq64YkNxUIa25T9umhr4uRe94ESHujM\nIRrBbbqu1p3Vs8N3whZNhcL6Djb4ob18m/aGKbF+UQBMvhn23qRCG6KKzIeDY6Os\n8tYyIwush2XeOFA7S5syPqVBI6PrRBDMCLmAJO4qTM2p0f+zyFXFuytCXOv2fA3M\n88aYVmU7NIfBTFdqNIgSt1yj7FKvd5zgoUyu7mTVdzY59xQzkzYTsnobY2XrTcvY\n6wyRqOAQ86wR8OvDjHB5y/YN2Pdg7d9jUFBCX6Ohr7W3GHrjAadKwq+kbH1aP0oB\nQTFLQQfl3gtJ3Dl/5iBQD38sCIkA54FPSsKTRw3mC4DImBQ=\n-----END CERTIFICATE-----"
private const val newJSONSignature = "sig=\"VpuLfRlB0DizR+hRWmedPGHdx/nzNJ8OomMZNGHwqx64zrx1XezriBoItup/icOlXFrqs6FHaul4g5m41JfEWCUbhXC4x+iNk//bxozEYJHmjbcAtC6xhWbMMYQQaUjuYk7rEL987AbOWyUI2lMhrhK7LNzBaT8RGqBcpEyAqIOMuEKcK0faySnWJylc7IzxHmO8jlx5ufzio8301wej8mNW5dZd7PFOX8Dz015tIpF00VGi29ShDNFbpnalch7f92NFs08Z0g9LXndmrGjNL84Wqd4kq5awRGQObrCuDHU4uFdZjtr4ew0JaNlVuyUrrjyDloBdq0aR804vuDXacQ==\""

@RunWith(AndroidJUnit4ClassRunner::class)
class FileDownloaderManifestParsingTest {
  @Test
  @Throws(JSONException::class)
  fun testManifestParsing_JSONBody() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val contentType = "application/json"
    val response = mockk<Response>().apply {
      every { header("content-type") } returns contentType
      every { headers } returns mapOf("content-type" to contentType).toHeaders()
      every { body } returns ResponseBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), classicJSON)
    }

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test"),
      )
    )

    var errorOccurred = false
    var resultUpdateManifest: UpdateManifest? = null

    FileDownloader(context).parseManifestResponse(
      response, configuration,
      object : FileDownloader.ManifestDownloadCallback {
        override fun onFailure(message: String, e: Exception) {
          errorOccurred = true
        }

        override fun onSuccess(updateManifest: UpdateManifest) {
          resultUpdateManifest = updateManifest
        }
      }
    )

    Assert.assertFalse(errorOccurred)
    Assert.assertNotNull(resultUpdateManifest)
  }

  @Test
  @Throws(JSONException::class)
  fun testManifestParsing_MultipartBody() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val boundary = "blah"
    val contentType = "multipart/mixed; boundary=$boundary"

    val extensions = "{}"

    val multipartBody = MultipartBody.Builder(boundary)
      .setType(MultipartBody.MIXED)
      .addPart(
        mapOf("Content-Disposition" to "form-data; name=\"extraneous\"; filename=\"hello1\"").toHeaders(),
        RequestBody.create("text/plain; charset=utf-8".toMediaTypeOrNull(), "hello")
      )
      .addPart(
        mapOf("Content-Disposition" to "form-data; name=\"manifest\"; filename=\"hello2\"").toHeaders(),
        RequestBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), classicJSON)
      )
      .addPart(
        mapOf("Content-Disposition" to "form-data; name=\"extensions\"; filename=\"hello3\"").toHeaders(),
        RequestBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), extensions)
      )
      .build()

    val contentBuffer = Buffer().also { multipartBody.writeTo(it) }

    val response = mockk<Response>().apply {
      every { header("content-type") } returns contentType
      every { headers } returns mapOf("content-type" to contentType).toHeaders()
      every { body } returns ResponseBody.create(MultipartBody.MIXED, contentBuffer.readByteArray())
    }

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test"),
      )
    )

    var errorOccurred = false
    var resultUpdateManifest: UpdateManifest? = null

    FileDownloader(context).parseManifestResponse(
      response, configuration,
      object : FileDownloader.ManifestDownloadCallback {
        override fun onFailure(message: String, e: Exception) {
          errorOccurred = true
        }

        override fun onSuccess(updateManifest: UpdateManifest) {
          resultUpdateManifest = updateManifest
        }
      }
    )

    Assert.assertFalse(errorOccurred)
    Assert.assertNotNull(resultUpdateManifest)
  }

  @Test
  @Throws(JSONException::class)
  fun testManifestParsing_JSONBodySigned() {
    val contentType = "application/json"
    val headersMap = mapOf(
      "expo-protocol-version" to "0",
      "expo-sfv-version" to "0",
      "content-type" to contentType,
      "expo-signature" to newJSONSignature
    )

    val context = InstrumentationRegistry.getInstrumentation().targetContext

    val response = mockk<Response>().apply {
      headersMap.forEach {
        every { header(it.key) } returns it.value
      }
      every { headers } returns headersMap.toHeaders()
      every { body } returns ResponseBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), newJSON)
    }

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test"),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_CERTIFICATE to newJSONCertificate,
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_METADATA to mapOf<String, String>(),
      )
    )

    var errorOccurred = false
    var resultUpdateManifest: UpdateManifest? = null

    FileDownloader(context).parseManifestResponse(
      response, configuration,
      object : FileDownloader.ManifestDownloadCallback {
        override fun onFailure(message: String, e: Exception) {
          errorOccurred = true
        }

        override fun onSuccess(updateManifest: UpdateManifest) {
          resultUpdateManifest = updateManifest
        }
      }
    )

    Assert.assertFalse(errorOccurred)
    Assert.assertNotNull(resultUpdateManifest)
  }

  @Test
  @Throws(JSONException::class)
  fun testManifestParsing_MultipartBodySigned() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val boundary = "blah"
    val contentType = "multipart/mixed; boundary=$boundary"

    val headersMap = mapOf(
      "expo-protocol-version" to "0",
      "expo-sfv-version" to "0",
      "content-type" to contentType,
    )

    val extensions = "{}"

    val multipartBody = MultipartBody.Builder(boundary)
      .setType(MultipartBody.MIXED)
      .addPart(
        mapOf("Content-Disposition" to "form-data; name=\"extraneous\"; filename=\"hello1\"").toHeaders(),
        RequestBody.create("text/plain; charset=utf-8".toMediaTypeOrNull(), "hello")
      )
      .addPart(
        mapOf(
          "Content-Disposition" to "form-data; name=\"manifest\"; filename=\"hello2\"",
          "expo-signature" to newJSONSignature
        )
          .toHeaders(),
        RequestBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), newJSON)
      )
      .addPart(
        mapOf("Content-Disposition" to "form-data; name=\"extensions\"; filename=\"hello3\"").toHeaders(),
        RequestBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), extensions)
      )
      .build()

    val contentBuffer = Buffer().also { multipartBody.writeTo(it) }

    val response = mockk<Response>().apply {
      headersMap.forEach {
        every { header(it.key) } returns it.value
      }
      every { headers } returns headersMap.toHeaders()
      every { body } returns ResponseBody.create(MultipartBody.MIXED, contentBuffer.readByteArray())
    }

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test"),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_CERTIFICATE to newJSONCertificate,
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_METADATA to mapOf<String, String>(),
      )
    )

    var errorOccurred = false
    var resultUpdateManifest: UpdateManifest? = null

    FileDownloader(context).parseManifestResponse(
      response, configuration,
      object : FileDownloader.ManifestDownloadCallback {
        override fun onFailure(message: String, e: Exception) {
          errorOccurred = true
        }

        override fun onSuccess(updateManifest: UpdateManifest) {
          resultUpdateManifest = updateManifest
        }
      }
    )

    Assert.assertFalse(errorOccurred)
    Assert.assertNotNull(resultUpdateManifest)
  }

  @Test
  fun testManifestParsing_JSONBodySigned_UnsignedRequest() {
    val contentType = "application/json"
    val headersMap = mapOf(
      "expo-protocol-version" to "0",
      "expo-sfv-version" to "0",
      "content-type" to contentType,
    )

    val context = InstrumentationRegistry.getInstrumentation().targetContext

    val response = mockk<Response>().apply {
      headersMap.forEach {
        every { header(it.key) } returns it.value
      }
      every { headers } returns headersMap.toHeaders()
      every { body } returns ResponseBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), newJSON)
    }

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test"),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_CERTIFICATE to newJSONCertificate,
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_METADATA to mapOf<String, String>(),
      )
    )

    var errorOccurred: Exception? = null
    var resultUpdateManifest: UpdateManifest? = null

    FileDownloader(context).parseManifestResponse(
      response, configuration,
      object : FileDownloader.ManifestDownloadCallback {
        override fun onFailure(message: String, e: Exception) {
          errorOccurred = e
        }

        override fun onSuccess(updateManifest: UpdateManifest) {
          resultUpdateManifest = updateManifest
        }
      }
    )

    Assert.assertEquals(errorOccurred!!.message, "No expo-signature header specified")
    Assert.assertNull(resultUpdateManifest)
  }
}
