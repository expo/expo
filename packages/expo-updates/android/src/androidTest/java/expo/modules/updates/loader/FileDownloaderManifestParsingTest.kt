package expo.modules.updates.loader

import android.net.Uri
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.codesigning.*
import expo.modules.updates.manifest.UpdateManifest
import expo.modules.updates.codesigning.CertificateFixtures
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
      every { headers } returns mapOf("content-type" to contentType).toHeaders()
      every { body } returns ResponseBody.create(
        "application/json; charset=utf-8".toMediaTypeOrNull(),
        CertificateFixtures.testClassicManifestBody
      )
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
    Assert.assertFalse(resultUpdateManifest!!.manifest.isVerified())
  }

  @Test
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
        RequestBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), CertificateFixtures.testClassicManifestBody)
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
    Assert.assertFalse(resultUpdateManifest!!.manifest.isVerified())
  }

  @Test
  fun testManifestParsing_JSONBodySigned() {
    val contentType = "application/json"
    val headersMap = mapOf(
      "expo-protocol-version" to "0",
      "expo-sfv-version" to "0",
      "content-type" to contentType,
      "expo-signature" to CertificateFixtures.testNewManifestBodySignature
    )

    val context = InstrumentationRegistry.getInstrumentation().targetContext

    val response = mockk<Response>().apply {
      headersMap.forEach {
        every { header(it.key) } returns it.value
      }
      every { headers } returns headersMap.toHeaders()
      every { body } returns ResponseBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), CertificateFixtures.testNewManifestBody)
    }

    val testCertificate = getTestCertificate(TestCertificateType.VALID)
    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test"),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_CERTIFICATE to testCertificate,
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
    Assert.assertTrue(resultUpdateManifest!!.manifest.isVerified())
  }

  @Test
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
          "expo-signature" to CertificateFixtures.testNewManifestBodySignature
        )
          .toHeaders(),
        RequestBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), CertificateFixtures.testNewManifestBody)
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

    val testCertificate = getTestCertificate(TestCertificateType.VALID)
    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test"),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_CERTIFICATE to testCertificate,
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
    Assert.assertTrue(resultUpdateManifest!!.manifest.isVerified())
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
      every { body } returns ResponseBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), CertificateFixtures.testNewManifestBody)
    }

    val testCertificate = getTestCertificate(TestCertificateType.VALID)
    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test"),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_CERTIFICATE to testCertificate,
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

    Assert.assertEquals("No expo-signature header specified", errorOccurred!!.message)
    Assert.assertNull(resultUpdateManifest)
  }

  @Test
  fun testManifestParsing_MultipartBodySignedCertificateParticularExperience() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val boundary = "blah"
    val contentType = "multipart/mixed; boundary=$boundary"

    val headersMap = mapOf(
      "expo-protocol-version" to "0",
      "expo-sfv-version" to "0",
      "content-type" to contentType,
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
          "expo-signature" to CertificateFixtures.testNewManifestBodyValidChainLeafSignature
        )
          .toHeaders(),
        RequestBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), CertificateFixtures.testNewManifestBody)
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
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_INCLUDE_MANIFEST_RESPONSE_CERTIFICATE_CHAIN to true,
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
    Assert.assertTrue(resultUpdateManifest!!.manifest.isVerified())
  }

  @Test
  fun testManifestParsing_MultipartBodySignedCertificateParticularExperience_IncorrectExperienceInManifest() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val boundary = "blah"
    val contentType = "multipart/mixed; boundary=$boundary"

    val headersMap = mapOf(
      "expo-protocol-version" to "0",
      "expo-sfv-version" to "0",
      "content-type" to contentType,
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
          "expo-signature" to CertificateFixtures.testNewManifestBodyValidChainLeafSignatureIncorrectProjectId
        )
          .toHeaders(),
        RequestBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), CertificateFixtures.testNewManifestBodyIncorrectProjectId)
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
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_INCLUDE_MANIFEST_RESPONSE_CERTIFICATE_CHAIN to true,
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

    Assert.assertEquals("Invalid certificate for manifest project ID or scope key", errorOccurred!!.message)
    Assert.assertNull(resultUpdateManifest)
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
      every { body } returns ResponseBody.create("application/json; charset=utf-8".toMediaTypeOrNull(), CertificateFixtures.testNewManifestBody)
    }

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test"),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_CERTIFICATE to getTestCertificate(TestCertificateType.VALID),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_METADATA to mapOf<String, String>(),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_ALLOW_UNSIGNED_MANIFESTS to true,
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
}
