package expo.modules.updates.loader

import android.net.Uri
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.codesigning.*
import expo.modules.updates.manifest.Update
import expo.modules.updates.codesigning.TestCertificateType
import expo.modules.updates.codesigning.getTestCertificate
import io.mockk.every
import io.mockk.mockk
import okhttp3.*
import okhttp3.Headers.Companion.toHeaders
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okio.Buffer
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4ClassRunner::class)
class FileDownloaderManifestParsingTest {
  @Test
  fun testManifestParsing_JSONBody() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val contentType = "application/json"
    val response = mockk<Response>().apply {
      every { header("content-type") } returns contentType
      every { headers } returns mapOf("content-type" to contentType, "expo-protocol-version" to "0").toHeaders()
      every { code } returns 200
      every { body } returns ResponseBody.create(
        "application/json; charset=utf-8".toMediaTypeOrNull(),
        CertificateFixtures.testExpoUpdatesManifestBody
      )
    }

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test")
      )
    )

    var errorOccurred = false
    var resultUpdate: Update? = null

    FileDownloader(context, configuration).parseRemoteUpdateResponse(
      response,
      object : FileDownloader.RemoteUpdateDownloadCallback {
        override fun onFailure(message: String, e: Exception) {
          errorOccurred = true
        }

        override fun onSuccess(updateResponse: UpdateResponse) {
          resultUpdate = updateResponse.manifestUpdateResponsePart?.update
        }
      }
    )

    Assert.assertFalse(errorOccurred)
    Assert.assertNotNull(resultUpdate)
    Assert.assertFalse(resultUpdate!!.manifest.isVerified())
  }

  @Test
  fun testManifestParsing_MultipartBody() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val boundary = "blah"
    val contentType = "multipart/mixed; boundary=$boundary"

    val extensions = "{}"
    val directive = CertificateFixtures.testDirectiveNoUpdateAvailable

    val multipartBody = MultipartBody.Builder(boundary)
      .setType(MultipartBody.MIXED)
      .addPart(
        mapOf("Content-Disposition" to "form-data; name=\"extraneous\"; filename=\"hello1\"").toHeaders(),
        RequestBody.create("text/plain; charset=utf-8".toMediaTypeOrNull(), "hello")
      )
      .addPart(
        mapOf("Content-Disposition" to "form-data; name=\"manifest\"; filename=\"hello2\"").toHeaders(),
        RequestBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), CertificateFixtures.testExpoUpdatesManifestBody)
      )
      .addPart(
        mapOf("Content-Disposition" to "form-data; name=\"extensions\"; filename=\"hello3\"").toHeaders(),
        RequestBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), extensions)
      )
      .addPart(
        mapOf("Content-Disposition" to "form-data; name=\"directive\"; filename=\"hello3\"").toHeaders(),
        RequestBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), directive)
      )
      .build()

    val contentBuffer = Buffer().also { multipartBody.writeTo(it) }

    val response = mockk<Response>().apply {
      every { header("content-type") } returns contentType
      every { headers } returns mapOf("content-type" to contentType, "expo-protocol-version" to "0").toHeaders()
      every { code } returns 200
      every { body } returns ResponseBody.create(MultipartBody.MIXED, contentBuffer.readByteArray())
    }

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test")
      )
    )

    var errorOccurred = false
    var resultUpdateResponse: UpdateResponse? = null

    FileDownloader(context, configuration).parseRemoteUpdateResponse(
      response,
      object : FileDownloader.RemoteUpdateDownloadCallback {
        override fun onFailure(message: String, e: Exception) {
          errorOccurred = true
        }

        override fun onSuccess(updateResponse: UpdateResponse) {
          resultUpdateResponse = updateResponse
        }
      }
    )

    Assert.assertFalse(errorOccurred)

    Assert.assertNotNull(resultUpdateResponse)
    Assert.assertNotNull(resultUpdateResponse!!.manifestUpdateResponsePart)
    Assert.assertFalse(resultUpdateResponse!!.manifestUpdateResponsePart!!.update.manifest.isVerified())

    Assert.assertNotNull(resultUpdateResponse!!.directiveUpdateResponsePart)
    Assert.assertTrue(resultUpdateResponse!!.directiveUpdateResponsePart!!.updateDirective is UpdateDirective.NoUpdateAvailableUpdateDirective)
  }

  @Test
  fun testManifestParsing_MultipartBodyOnlyDirective() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val boundary = "blah"
    val contentType = "multipart/mixed; boundary=$boundary"

    val directive = CertificateFixtures.testDirectiveNoUpdateAvailable

    val multipartBody = MultipartBody.Builder(boundary)
      .setType(MultipartBody.MIXED)
      .addPart(
        mapOf("Content-Disposition" to "form-data; name=\"directive\"; filename=\"hello3\"").toHeaders(),
        RequestBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), directive)
      )
      .build()

    val contentBuffer = Buffer().also { multipartBody.writeTo(it) }

    val response = mockk<Response>().apply {
      every { header("content-type") } returns contentType
      every { headers } returns mapOf("content-type" to contentType).toHeaders()
      every { code } returns 200
      every { body } returns ResponseBody.create(MultipartBody.MIXED, contentBuffer.readByteArray())
    }

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test")
      )
    )

    var errorOccurred = false
    var resultUpdateResponse: UpdateResponse? = null

    FileDownloader(context, configuration).parseRemoteUpdateResponse(
      response,
      object : FileDownloader.RemoteUpdateDownloadCallback {
        override fun onFailure(message: String, e: Exception) {
          errorOccurred = true
        }

        override fun onSuccess(updateResponse: UpdateResponse) {
          resultUpdateResponse = updateResponse
        }
      }
    )

    Assert.assertFalse(errorOccurred)

    Assert.assertNotNull(resultUpdateResponse)
    Assert.assertNull(resultUpdateResponse!!.manifestUpdateResponsePart)

    Assert.assertNotNull(resultUpdateResponse!!.directiveUpdateResponsePart)
    Assert.assertTrue(resultUpdateResponse!!.directiveUpdateResponsePart!!.updateDirective is UpdateDirective.NoUpdateAvailableUpdateDirective)
  }

  @Test
  fun testManifestParsing_MultipartBodyOnlyDirective_v0CompatibilityMode() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val boundary = "blah"
    val contentType = "multipart/mixed; boundary=$boundary"

    val directive = CertificateFixtures.testDirectiveNoUpdateAvailable

    val multipartBody = MultipartBody.Builder(boundary)
      .setType(MultipartBody.MIXED)
      .addPart(
        mapOf("Content-Disposition" to "form-data; name=\"directive\"; filename=\"hello3\"").toHeaders(),
        RequestBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), directive)
      )
      .build()

    val contentBuffer = Buffer().also { multipartBody.writeTo(it) }

    val response = mockk<Response>().apply {
      every { header("content-type") } returns contentType
      every { headers } returns mapOf("content-type" to contentType).toHeaders()
      every { code } returns 200
      every { body } returns ResponseBody.create(MultipartBody.MIXED, contentBuffer.readByteArray())
    }

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test"),
        UpdatesConfiguration.UPDATES_CONFIGURATION_ENABLE_EXPO_UPDATES_PROTOCOL_V0_COMPATIBILITY_MODE to true
      )
    )

    var errorOccurred: Exception? = null
    var resultUpdate: Update? = null

    FileDownloader(context, configuration).parseRemoteUpdateResponse(
      response,
      object : FileDownloader.RemoteUpdateDownloadCallback {
        override fun onFailure(message: String, e: Exception) {
          errorOccurred = e
        }

        override fun onSuccess(updateResponse: UpdateResponse) {
          resultUpdate = updateResponse.manifestUpdateResponsePart?.update
        }
      }
    )

    Assert.assertEquals("Multipart response missing manifest part. Manifest is required in version 0 of the expo-updates protocol. This may be due to the update being a rollback or other directive.", errorOccurred!!.message)
    Assert.assertNull(resultUpdate)
  }

  @Test
  fun testManifestParsing_MultipartBodyNoRelevantParts() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val boundary = "blah"
    val contentType = "multipart/mixed; boundary=$boundary"

    val multipartBody = MultipartBody.Builder(boundary)
      .setType(MultipartBody.MIXED)
      .addPart(
        mapOf("Content-Disposition" to "form-data; name=\"fake\"; filename=\"hello3\"").toHeaders(),
        RequestBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), "")
      )
      .build()

    val contentBuffer = Buffer().also { multipartBody.writeTo(it) }

    val response = mockk<Response>().apply {
      every { header("content-type") } returns contentType
      every { headers } returns mapOf("content-type" to contentType).toHeaders()
      every { code } returns 200
      every { body } returns ResponseBody.create(MultipartBody.MIXED, contentBuffer.readByteArray())
    }

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test")
      )
    )

    var errorOccurred = false
    var resultUpdateResponse: UpdateResponse? = null

    FileDownloader(context, configuration).parseRemoteUpdateResponse(
      response,
      object : FileDownloader.RemoteUpdateDownloadCallback {
        override fun onFailure(message: String, e: Exception) {
          errorOccurred = true
        }

        override fun onSuccess(updateResponse: UpdateResponse) {
          resultUpdateResponse = updateResponse
        }
      }
    )

    Assert.assertFalse(errorOccurred)

    Assert.assertNotNull(resultUpdateResponse)
    Assert.assertNull(resultUpdateResponse!!.manifestUpdateResponsePart)
    Assert.assertNull(resultUpdateResponse!!.directiveUpdateResponsePart)
  }

  @Test
  fun testManifestParsing_MultipartBodyEmpty() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val boundary = "blah"
    val contentType = "multipart/mixed; boundary=$boundary"

    val response = mockk<Response>().apply {
      every { header("content-type") } returns contentType
      every { headers } returns mapOf("content-type" to contentType).toHeaders()
      every { code } returns 200
      every { body } returns ResponseBody.create(MultipartBody.MIXED, "")
    }

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test")
      )
    )

    var errorOccurred = false
    var resultUpdateResponse: UpdateResponse? = null

    FileDownloader(context, configuration).parseRemoteUpdateResponse(
      response,
      object : FileDownloader.RemoteUpdateDownloadCallback {
        override fun onFailure(message: String, e: Exception) {
          errorOccurred = true
        }

        override fun onSuccess(updateResponse: UpdateResponse) {
          resultUpdateResponse = updateResponse
        }
      }
    )

    Assert.assertFalse(errorOccurred)

    Assert.assertNotNull(resultUpdateResponse)
    Assert.assertNull(resultUpdateResponse!!.manifestUpdateResponsePart)
    Assert.assertNull(resultUpdateResponse!!.directiveUpdateResponsePart)
  }

  @Test
  fun testManifestParsing_NullBodyResponseProtocol1() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val response = mockk<Response>().apply {
      every { headers } returns mapOf("expo-protocol-version" to "1").toHeaders()
      every { code } returns 200
      every { body } returns null
    }

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test")
      )
    )

    var errorOccurred = false
    var resultUpdateResponse: UpdateResponse? = null

    FileDownloader(context, configuration).parseRemoteUpdateResponse(
      response,
      object : FileDownloader.RemoteUpdateDownloadCallback {
        override fun onFailure(message: String, e: Exception) {
          errorOccurred = true
        }

        override fun onSuccess(updateResponse: UpdateResponse) {
          resultUpdateResponse = updateResponse
        }
      }
    )

    Assert.assertFalse(errorOccurred)

    Assert.assertNotNull(resultUpdateResponse)
    Assert.assertNull(resultUpdateResponse!!.manifestUpdateResponsePart)
    Assert.assertNull(resultUpdateResponse!!.directiveUpdateResponsePart)
  }

  @Test
  fun testManifestParsing_204ResponseProtocol1() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val response = mockk<Response>().apply {
      every { headers } returns mapOf("expo-protocol-version" to "1").toHeaders()
      every { code } returns 204
      every { body } returns null
    }

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test")
      )
    )

    var errorOccurred = false
    var resultUpdateResponse: UpdateResponse? = null

    FileDownloader(context, configuration).parseRemoteUpdateResponse(
      response,
      object : FileDownloader.RemoteUpdateDownloadCallback {
        override fun onFailure(message: String, e: Exception) {
          errorOccurred = true
        }

        override fun onSuccess(updateResponse: UpdateResponse) {
          resultUpdateResponse = updateResponse
        }
      }
    )

    Assert.assertFalse(errorOccurred)

    Assert.assertNotNull(resultUpdateResponse)
    Assert.assertNull(resultUpdateResponse!!.manifestUpdateResponsePart)
    Assert.assertNull(resultUpdateResponse!!.directiveUpdateResponsePart)
  }

  @Test
  fun testManifestParsing_204ResponseNoProtocol() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val response = mockk<Response>().apply {
      every { header("content-type") } returns null
      every { headers } returns mapOf<String, String>().toHeaders()
      every { code } returns 204
      every { body } returns null
    }

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test")
      )
    )

    var errorOccurred: Exception? = null
    var resultUpdate: Update? = null

    FileDownloader(context, configuration).parseRemoteUpdateResponse(
      response,
      object : FileDownloader.RemoteUpdateDownloadCallback {
        override fun onFailure(message: String, e: Exception) {
          errorOccurred = e
        }

        override fun onSuccess(updateResponse: UpdateResponse) {
          resultUpdate = updateResponse.manifestUpdateResponsePart?.update
        }
      }
    )

    Assert.assertEquals("Missing body in remote update", errorOccurred!!.message)
    Assert.assertNull(resultUpdate)
  }

  @Test
  fun testManifestParsing_JSONBodySigned() {
    val contentType = "application/json"
    val headersMap = mapOf(
      "expo-protocol-version" to "0",
      "expo-sfv-version" to "0",
      "content-type" to contentType,
      "expo-signature" to CertificateFixtures.testExpoUpdatesManifestBodySignature
    )

    val context = InstrumentationRegistry.getInstrumentation().targetContext

    val response = mockk<Response>().apply {
      headersMap.forEach {
        every { header(it.key) } returns it.value
      }
      every { headers } returns headersMap.toHeaders()
      every { code } returns 200
      every { body } returns ResponseBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), CertificateFixtures.testExpoUpdatesManifestBody)
    }

    val testCertificate = getTestCertificate(TestCertificateType.VALID)
    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test"),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_CERTIFICATE to testCertificate,
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_METADATA to mapOf<String, String>()
      )
    )

    var errorOccurred = false
    var resultUpdate: Update? = null

    FileDownloader(context, configuration).parseRemoteUpdateResponse(
      response,
      object : FileDownloader.RemoteUpdateDownloadCallback {
        override fun onFailure(message: String, e: Exception) {
          errorOccurred = true
        }

        override fun onSuccess(updateResponse: UpdateResponse) {
          resultUpdate = updateResponse.manifestUpdateResponsePart?.update
        }
      }
    )

    Assert.assertFalse(errorOccurred)
    Assert.assertNotNull(resultUpdate)
    Assert.assertTrue(resultUpdate!!.manifest.isVerified())
  }

  @Test
  fun testManifestParsing_MultipartBodySigned() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val boundary = "blah"
    val contentType = "multipart/mixed; boundary=$boundary"

    val headersMap = mapOf(
      "expo-protocol-version" to "0",
      "expo-sfv-version" to "0",
      "content-type" to contentType
    )

    val extensions = "{}"
    val directive = CertificateFixtures.testDirectiveNoUpdateAvailable

    val multipartBody = MultipartBody.Builder(boundary)
      .setType(MultipartBody.MIXED)
      .addPart(
        mapOf("Content-Disposition" to "form-data; name=\"extraneous\"; filename=\"hello1\"").toHeaders(),
        RequestBody.create("text/plain; charset=utf-8".toMediaTypeOrNull(), "hello")
      )
      .addPart(
        mapOf(
          "Content-Disposition" to "form-data; name=\"manifest\"; filename=\"hello2\"",
          "expo-signature" to CertificateFixtures.testExpoUpdatesManifestBodySignature
        )
          .toHeaders(),
        RequestBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), CertificateFixtures.testExpoUpdatesManifestBody)
      )
      .addPart(
        mapOf("Content-Disposition" to "form-data; name=\"extensions\"; filename=\"hello3\"").toHeaders(),
        RequestBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), extensions)
      )
      .addPart(
        mapOf(
          "Content-Disposition" to "form-data; name=\"directive\"; filename=\"hello3\"",
          "expo-signature" to CertificateFixtures.testDirectiveNoUpdateAvailableSignature
        )
          .toHeaders(),
        RequestBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), directive)
      )
      .build()

    val contentBuffer = Buffer().also { multipartBody.writeTo(it) }

    val response = mockk<Response>().apply {
      headersMap.forEach {
        every { header(it.key) } returns it.value
      }
      every { headers } returns headersMap.toHeaders()
      every { code } returns 200
      every { body } returns ResponseBody.create(MultipartBody.MIXED, contentBuffer.readByteArray())
    }

    val testCertificate = getTestCertificate(TestCertificateType.VALID)
    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test"),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_CERTIFICATE to testCertificate,
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_METADATA to mapOf<String, String>()
      )
    )

    var errorOccurred = false
    var resultUpdateResponse: UpdateResponse? = null

    FileDownloader(context, configuration).parseRemoteUpdateResponse(
      response,
      object : FileDownloader.RemoteUpdateDownloadCallback {
        override fun onFailure(message: String, e: Exception) {
          errorOccurred = true
        }

        override fun onSuccess(updateResponse: UpdateResponse) {
          resultUpdateResponse = updateResponse
        }
      }
    )

    Assert.assertFalse(errorOccurred)

    Assert.assertNotNull(resultUpdateResponse)
    Assert.assertTrue(resultUpdateResponse!!.manifestUpdateResponsePart!!.update.manifest.isVerified())

    Assert.assertNotNull(resultUpdateResponse!!.directiveUpdateResponsePart)
    Assert.assertTrue(resultUpdateResponse!!.directiveUpdateResponsePart!!.updateDirective is UpdateDirective.NoUpdateAvailableUpdateDirective)
  }

  @Test
  fun testManifestParsing_JSONBodySigned_UnsignedRequest() {
    val contentType = "application/json"
    val headersMap = mapOf(
      "expo-protocol-version" to "0",
      "expo-sfv-version" to "0",
      "content-type" to contentType
    )

    val context = InstrumentationRegistry.getInstrumentation().targetContext

    val response = mockk<Response>().apply {
      headersMap.forEach {
        every { header(it.key) } returns it.value
      }
      every { headers } returns headersMap.toHeaders()
      every { code } returns 200
      every { body } returns ResponseBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), CertificateFixtures.testExpoUpdatesManifestBody)
    }

    val testCertificate = getTestCertificate(TestCertificateType.VALID)
    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test"),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_CERTIFICATE to testCertificate,
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_METADATA to mapOf<String, String>()
      )
    )

    var errorOccurred: Exception? = null
    var resultUpdate: Update? = null

    FileDownloader(context, configuration).parseRemoteUpdateResponse(
      response,
      object : FileDownloader.RemoteUpdateDownloadCallback {
        override fun onFailure(message: String, e: Exception) {
          errorOccurred = e
        }

        override fun onSuccess(updateResponse: UpdateResponse) {
          resultUpdate = updateResponse.manifestUpdateResponsePart?.update
        }
      }
    )

    Assert.assertEquals("No expo-signature header specified", errorOccurred!!.message)
    Assert.assertNull(resultUpdate)
  }

  @Test
  fun testManifestParsing_MultipartBodySignedCertificateParticularExperience() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val boundary = "blah"
    val contentType = "multipart/mixed; boundary=$boundary"

    val headersMap = mapOf(
      "expo-protocol-version" to "0",
      "expo-sfv-version" to "0",
      "content-type" to contentType
    )

    val extensions = "{}"
    val directive = CertificateFixtures.testDirectiveNoUpdateAvailable

    val leafCert = getTestCertificate(TestCertificateType.CHAIN_LEAF)
    val intermediateCert = getTestCertificate(TestCertificateType.CHAIN_INTERMEDIATE)
    val rootCert = getTestCertificate(TestCertificateType.CHAIN_ROOT)

    val multipartBody = MultipartBody.Builder(boundary)
      .setType(MultipartBody.MIXED)
      .addPart(
        mapOf("Content-Disposition" to "form-data; name=\"extraneous\"; filename=\"hello1\"").toHeaders(),
        RequestBody.create("text/plain; charset=utf-8".toMediaTypeOrNull(), "hello")
      )
      .addPart(
        mapOf(
          "Content-Disposition" to "form-data; name=\"manifest\"; filename=\"hello2\"",
          "expo-signature" to CertificateFixtures.testExpoUpdatesManifestBodyValidChainLeafSignature
        )
          .toHeaders(),
        RequestBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), CertificateFixtures.testExpoUpdatesManifestBody)
      )
      .addPart(
        mapOf("Content-Disposition" to "form-data; name=\"extensions\"; filename=\"hello3\"").toHeaders(),
        RequestBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), extensions)
      )
      .addPart(
        mapOf("Content-Disposition" to "form-data; name=\"certificate_chain\"; filename=\"hello4\"").toHeaders(),
        RequestBody.create("application/x-pem-file; charset=utf-8".toMediaTypeOrNull(), leafCert + intermediateCert)
      )
      .addPart(
        mapOf(
          "Content-Disposition" to "form-data; name=\"directive\"; filename=\"hello3\"",
          "expo-signature" to CertificateFixtures.testDirectiveNoUpdateAvailableValidChainLeafSignature
        )
          .toHeaders(),
        RequestBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), directive)
      )
      .build()

    val contentBuffer = Buffer().also { multipartBody.writeTo(it) }

    val response = mockk<Response>().apply {
      headersMap.forEach {
        every { header(it.key) } returns it.value
      }
      every { headers } returns headersMap.toHeaders()
      every { code } returns 200
      every { body } returns ResponseBody.create(MultipartBody.MIXED, contentBuffer.readByteArray())
    }

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test"),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_CERTIFICATE to rootCert,
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_METADATA to mapOf(
          CODE_SIGNING_METADATA_KEY_ID_KEY to "ca-root"
        ),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_INCLUDE_MANIFEST_RESPONSE_CERTIFICATE_CHAIN to true
      )
    )

    var errorOccurred = false
    var resultUpdateResponse: UpdateResponse? = null

    FileDownloader(context, configuration).parseRemoteUpdateResponse(
      response,
      object : FileDownloader.RemoteUpdateDownloadCallback {
        override fun onFailure(message: String, e: Exception) {
          errorOccurred = true
        }

        override fun onSuccess(updateResponse: UpdateResponse) {
          resultUpdateResponse = updateResponse
        }
      }
    )

    Assert.assertFalse(errorOccurred)
    Assert.assertNotNull(resultUpdateResponse!!.manifestUpdateResponsePart?.update)
    Assert.assertTrue(resultUpdateResponse!!.manifestUpdateResponsePart?.update!!.manifest.isVerified())

    Assert.assertNotNull(resultUpdateResponse!!.directiveUpdateResponsePart)
    Assert.assertTrue(resultUpdateResponse!!.directiveUpdateResponsePart!!.updateDirective is UpdateDirective.NoUpdateAvailableUpdateDirective)
  }

  @Test
  fun testManifestParsing_MultipartBodySignedCertificateParticularExperience_IncorrectExperienceInManifest() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val boundary = "blah"
    val contentType = "multipart/mixed; boundary=$boundary"

    val headersMap = mapOf(
      "expo-protocol-version" to "0",
      "expo-sfv-version" to "0",
      "content-type" to contentType
    )

    val extensions = "{}"

    val leafCert = getTestCertificate(TestCertificateType.CHAIN_LEAF)
    val intermediateCert = getTestCertificate(TestCertificateType.CHAIN_INTERMEDIATE)
    val rootCert = getTestCertificate(TestCertificateType.CHAIN_ROOT)

    val multipartBody = MultipartBody.Builder(boundary)
      .setType(MultipartBody.MIXED)
      .addPart(
        mapOf("Content-Disposition" to "form-data; name=\"extraneous\"; filename=\"hello1\"").toHeaders(),
        RequestBody.create("text/plain; charset=utf-8".toMediaTypeOrNull(), "hello")
      )
      .addPart(
        mapOf(
          "Content-Disposition" to "form-data; name=\"manifest\"; filename=\"hello2\"",
          "expo-signature" to CertificateFixtures.testExpoUpdatesManifestBodyValidChainLeafSignatureIncorrectProjectId
        )
          .toHeaders(),
        RequestBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), CertificateFixtures.testExpoUpdatesManifestBodyIncorrectProjectId)
      )
      .addPart(
        mapOf("Content-Disposition" to "form-data; name=\"extensions\"; filename=\"hello3\"").toHeaders(),
        RequestBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), extensions)
      )
      .addPart(
        mapOf("Content-Disposition" to "form-data; name=\"certificate_chain\"; filename=\"hello4\"").toHeaders(),
        RequestBody.create("application/x-pem-file; charset=utf-8".toMediaTypeOrNull(), leafCert + intermediateCert)
      )
      .build()

    val contentBuffer = Buffer().also { multipartBody.writeTo(it) }

    val response = mockk<Response>().apply {
      headersMap.forEach {
        every { header(it.key) } returns it.value
      }
      every { headers } returns headersMap.toHeaders()
      every { code } returns 200
      every { body } returns ResponseBody.create(MultipartBody.MIXED, contentBuffer.readByteArray())
    }

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test"),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_CERTIFICATE to rootCert,
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_METADATA to mapOf(
          CODE_SIGNING_METADATA_KEY_ID_KEY to "ca-root"
        ),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_INCLUDE_MANIFEST_RESPONSE_CERTIFICATE_CHAIN to true
      )
    )

    var errorOccurred: Exception? = null
    var resultUpdate: Update? = null

    FileDownloader(context, configuration).parseRemoteUpdateResponse(
      response,
      object : FileDownloader.RemoteUpdateDownloadCallback {
        override fun onFailure(message: String, e: Exception) {
          errorOccurred = e
        }

        override fun onSuccess(updateResponse: UpdateResponse) {
          resultUpdate = updateResponse.manifestUpdateResponsePart?.update
        }
      }
    )

    Assert.assertEquals("Invalid certificate for manifest project ID or scope key", errorOccurred!!.message)
    Assert.assertNull(resultUpdate)
  }

  @Test
  fun testManifestParsing_MultipartBodySignedCertificateParticularExperience_IncorrectExperienceInDirective() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val boundary = "blah"
    val contentType = "multipart/mixed; boundary=$boundary"

    val headersMap = mapOf(
      "expo-protocol-version" to "0",
      "expo-sfv-version" to "0",
      "content-type" to contentType
    )

    val directive = CertificateFixtures.testDirectiveNoUpdateAvailableIncorrectProjectId

    val leafCert = getTestCertificate(TestCertificateType.CHAIN_LEAF)
    val intermediateCert = getTestCertificate(TestCertificateType.CHAIN_INTERMEDIATE)
    val rootCert = getTestCertificate(TestCertificateType.CHAIN_ROOT)

    val multipartBody = MultipartBody.Builder(boundary)
      .setType(MultipartBody.MIXED)
      .addPart(
        mapOf("Content-Disposition" to "form-data; name=\"extraneous\"; filename=\"hello1\"").toHeaders(),
        RequestBody.create("text/plain; charset=utf-8".toMediaTypeOrNull(), "hello")
      )
      .addPart(
        mapOf("Content-Disposition" to "form-data; name=\"certificate_chain\"; filename=\"hello4\"").toHeaders(),
        RequestBody.create("application/x-pem-file; charset=utf-8".toMediaTypeOrNull(), leafCert + intermediateCert)
      )
      .addPart(
        mapOf(
          "Content-Disposition" to "form-data; name=\"directive\"; filename=\"hello3\"",
          "expo-signature" to CertificateFixtures.testDirectiveNoUpdateAvailableValidChainLeafSignatureIncorrectProjectId
        )
          .toHeaders(),
        RequestBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), directive)
      )
      .build()

    val contentBuffer = Buffer().also { multipartBody.writeTo(it) }

    val response = mockk<Response>().apply {
      headersMap.forEach {
        every { header(it.key) } returns it.value
      }
      every { headers } returns headersMap.toHeaders()
      every { code } returns 200
      every { body } returns ResponseBody.create(MultipartBody.MIXED, contentBuffer.readByteArray())
    }

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test"),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_CERTIFICATE to rootCert,
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_METADATA to mapOf(
          CODE_SIGNING_METADATA_KEY_ID_KEY to "ca-root"
        ),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_INCLUDE_MANIFEST_RESPONSE_CERTIFICATE_CHAIN to true
      )
    )

    var errorOccurred: Exception? = null
    var resultUpdateResponse: UpdateResponse? = null

    FileDownloader(context, configuration).parseRemoteUpdateResponse(
      response,
      object : FileDownloader.RemoteUpdateDownloadCallback {
        override fun onFailure(message: String, e: Exception) {
          errorOccurred = e
        }

        override fun onSuccess(updateResponse: UpdateResponse) {
          resultUpdateResponse = updateResponse
        }
      }
    )

    Assert.assertEquals("Invalid certificate for directive project ID or scope key", errorOccurred!!.message)
    Assert.assertNull(resultUpdateResponse)
  }

  @Test
  fun testManifestParsing_JSONBodySigned_UnsignedRequest_ManifestSignatureOptional() {
    val contentType = "application/json"
    val headersMap = mapOf(
      "expo-protocol-version" to "0",
      "expo-sfv-version" to "0",
      "content-type" to contentType
    )

    val context = InstrumentationRegistry.getInstrumentation().targetContext

    val response = mockk<Response>().apply {
      headersMap.forEach {
        every { header(it.key) } returns it.value
      }
      every { headers } returns headersMap.toHeaders()
      every { code } returns 200
      every { body } returns ResponseBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), CertificateFixtures.testExpoUpdatesManifestBody)
    }

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test"),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_CERTIFICATE to getTestCertificate(TestCertificateType.VALID),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_METADATA to mapOf<String, String>(),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_ALLOW_UNSIGNED_MANIFESTS to true
      )
    )

    var errorOccurred = false
    var resultUpdate: Update? = null

    FileDownloader(context, configuration).parseRemoteUpdateResponse(
      response,
      object : FileDownloader.RemoteUpdateDownloadCallback {
        override fun onFailure(message: String, e: Exception) {
          errorOccurred = true
        }

        override fun onSuccess(updateResponse: UpdateResponse) {
          resultUpdate = updateResponse.manifestUpdateResponsePart?.update
        }
      }
    )

    Assert.assertFalse(errorOccurred)
    Assert.assertNotNull(resultUpdate)
  }
}
