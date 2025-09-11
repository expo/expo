package expo.modules.updates.loader

import android.net.Uri
import expo.modules.core.logging.localizedMessageWithCauseLocalizedMessage
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.codesigning.CODE_SIGNING_METADATA_KEY_ID_KEY
import expo.modules.updates.codesigning.CertificateFixtures
import expo.modules.updates.codesigning.TestCertificateType
import expo.modules.updates.codesigning.TestUtils.asJSONResponse
import expo.modules.updates.codesigning.TestUtils.asResponse
import expo.modules.updates.codesigning.getTestCertificate
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.Update
import kotlinx.coroutines.test.runTest
import okhttp3.Headers.Companion.toHeaders
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class FileDownloaderManifestParsingTest {
  @get:Rule
  val temporaryFolder = TemporaryFolder()

  @Test
  fun testManifestParsing_JSONBody() = runTest {
    val response = CertificateFixtures.testExpoUpdatesManifestBody.asJSONResponse(mapOf("expo-protocol-version" to "0").toHeaders())

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test")
      )
    )

    val fileDownloader = createFileDownloader(configuration)
    val updateResponse = fileDownloader.parseRemoteUpdateResponse(response)
    val resultUpdate = updateResponse.manifestUpdateResponsePart?.update

    Assert.assertNotNull(resultUpdate)
    Assert.assertFalse(resultUpdate!!.manifest.isVerified())
  }

  @Test
  fun testManifestParsing_MultipartBody() = runTest {
    val filesDirectory = temporaryFolder.newFolder()
    val logDirectory = temporaryFolder.newFolder()
    val boundary = "blah"

    val extensions = "{}"
    val directive = CertificateFixtures.testDirectiveNoUpdateAvailable

    val response = MultipartBody.Builder(boundary)
      .setType(MultipartBody.MIXED)
      .addFormDataPart("extraneous", "hello1", "hello".toRequestBody("text/plain; charset=utf-8".toMediaTypeOrNull()))
      .addFormDataPart("manifest", "hello2", CertificateFixtures.testExpoUpdatesManifestBody.toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull()))
      .addFormDataPart("extensions", "hello3", extensions.toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull()))
      .addFormDataPart("directive", "hello3", directive.toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull()))
      .build()
      .asResponse(mapOf("expo-protocol-version" to "0").toHeaders())

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test")
      )
    )

    val resultUpdateResponse = FileDownloader(filesDirectory, "", configuration, UpdatesLogger(logDirectory)).parseRemoteUpdateResponse(response)

    Assert.assertNotNull(resultUpdateResponse)
    Assert.assertNotNull(resultUpdateResponse.manifestUpdateResponsePart)
    Assert.assertFalse(resultUpdateResponse.manifestUpdateResponsePart!!.update.manifest.isVerified())

    Assert.assertNotNull(resultUpdateResponse.directiveUpdateResponsePart)
    Assert.assertTrue(resultUpdateResponse.directiveUpdateResponsePart!!.updateDirective is UpdateDirective.NoUpdateAvailableUpdateDirective)
  }

  @Test
  fun testManifestParsing_MultipartBodyOnlyDirective() = runTest {
    val boundary = "blah"

    val directive = CertificateFixtures.testDirectiveNoUpdateAvailable

    val response = MultipartBody.Builder(boundary)
      .setType(MultipartBody.MIXED)
      .addFormDataPart("directive", "hello3", directive.toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull()))
      .build()
      .asResponse()

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test")
      )
    )

    val fileDownloader = createFileDownloader(configuration)
    val resultUpdateResponse = fileDownloader.parseRemoteUpdateResponse(response)

    Assert.assertNotNull(resultUpdateResponse)
    Assert.assertNull(resultUpdateResponse.manifestUpdateResponsePart)

    Assert.assertNotNull(resultUpdateResponse.directiveUpdateResponsePart)
    Assert.assertTrue(resultUpdateResponse.directiveUpdateResponsePart!!.updateDirective is UpdateDirective.NoUpdateAvailableUpdateDirective)
  }

  @Test
  fun testManifestParsing_MultipartBodyOnlyDirective_v0CompatibilityMode() = runTest {
    val boundary = "blah"
    val directive = CertificateFixtures.testDirectiveNoUpdateAvailable

    val response = MultipartBody.Builder(boundary)
      .setType(MultipartBody.MIXED)
      .addFormDataPart("directive", "hello3", directive.toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull()))
      .build()
      .asResponse()

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test"),
        UpdatesConfiguration.UPDATES_CONFIGURATION_ENABLE_EXPO_UPDATES_PROTOCOL_V0_COMPATIBILITY_MODE to true
      )
    )

    try {
      val fileDownloader = createFileDownloader(configuration)
      fileDownloader.parseRemoteUpdateResponse(response)
    } catch (e: Exception) {
      Assert.assertEquals("Invalid update response: Multipart response missing manifest part. Manifest is required in version 0 of the expo-updates protocol. This may be due to the response being for a different protocol version.", e.localizedMessageWithCauseLocalizedMessage())
    }
  }

  @Test
  fun testManifestParsing_MultipartBodyNoRelevantParts() = runTest {
    val boundary = "blah"

    val response = MultipartBody.Builder(boundary)
      .setType(MultipartBody.MIXED)
      .addFormDataPart("fake", " filename", "".toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull()))
      .build()
      .asResponse()

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test")
      )
    )

    val fileDownloader = createFileDownloader(configuration)
    val resultUpdateResponse = fileDownloader.parseRemoteUpdateResponse(response)

    Assert.assertNotNull(resultUpdateResponse)
    Assert.assertNull(resultUpdateResponse.manifestUpdateResponsePart)
    Assert.assertNull(resultUpdateResponse.directiveUpdateResponsePart)
  }

  @Test
  fun testManifestParsing_MultipartBodyEmpty() = runTest {
    val boundary = "blah"

    val response = Response.Builder()
      .request(Request.Builder().url("http://wat.com").build())
      .protocol(Protocol.HTTP_2)
      .message("")
      .code(200)
      .body("".toResponseBody("${MultipartBody.MIXED}; boundary=$boundary".toMediaType()))
      .build()

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test")
      )
    )

    val fileDownloader = createFileDownloader(configuration)
    val resultUpdateResponse = fileDownloader.parseRemoteUpdateResponse(response)

    Assert.assertNotNull(resultUpdateResponse)
    Assert.assertNull(resultUpdateResponse.manifestUpdateResponsePart)
    Assert.assertNull(resultUpdateResponse.directiveUpdateResponsePart)
  }

  @Test
  fun testManifestParsing_NullBodyResponseProtocol1() = runTest {
    val response = Response.Builder()
      .request(Request.Builder().url("http://wat.com").build())
      .protocol(Protocol.HTTP_2)
      .message("")
      .code(200)
      .header("expo-protocol-version", "1")
      .body(null)
      .build()

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test")
      )
    )

    val fileDownloader = createFileDownloader(configuration)
    val resultUpdateResponse = fileDownloader.parseRemoteUpdateResponse(response)

    Assert.assertNotNull(resultUpdateResponse)
    Assert.assertNull(resultUpdateResponse.manifestUpdateResponsePart)
    Assert.assertNull(resultUpdateResponse.directiveUpdateResponsePart)
  }

  @Test
  fun testManifestParsing_204ResponseProtocol1() = runTest {
    val response = Response.Builder()
      .request(Request.Builder().url("http://wat.com").build())
      .protocol(Protocol.HTTP_2)
      .message("")
      .code(204)
      .header("expo-protocol-version", "1")
      .body(null)
      .build()

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test")
      )
    )

    val fileDownloader = createFileDownloader(configuration)
    val resultUpdateResponse = fileDownloader.parseRemoteUpdateResponse(response)

    Assert.assertNotNull(resultUpdateResponse)
    Assert.assertNull(resultUpdateResponse.manifestUpdateResponsePart)
    Assert.assertNull(resultUpdateResponse.directiveUpdateResponsePart)
  }

  @Test
  fun testManifestParsing_204ResponseNoProtocol() = runTest {
    val response = Response.Builder()
      .request(Request.Builder().url("http://wat.com").build())
      .protocol(Protocol.HTTP_2)
      .message("")
      .code(204)
      .body(null)
      .build()

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test")
      )
    )

    try {
      val fileDownloader = createFileDownloader(configuration)
      fileDownloader.parseRemoteUpdateResponse(response)
      Assert.fail("Expected exception to be thrown")
    } catch (e: Exception) {
      Assert.assertEquals("Invalid update response: Empty body", e.localizedMessageWithCauseLocalizedMessage())
    }
  }

  @Test
  fun testManifestParsing_JSONBodySigned() = runTest {
    val headersMap = mapOf(
      "expo-protocol-version" to "0",
      "expo-sfv-version" to "0",
      "expo-signature" to CertificateFixtures.testExpoUpdatesManifestBodySignature
    )

    val response = CertificateFixtures.testExpoUpdatesManifestBody.asJSONResponse(headersMap.toHeaders())

    val testCertificate = getTestCertificate(TestCertificateType.VALID)
    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test"),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_CERTIFICATE to testCertificate,
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_METADATA to mapOf<String, String>()
      )
    )

    val fileDownloader = createFileDownloader(configuration)
    val updateResponse = fileDownloader.parseRemoteUpdateResponse(response)
    val resultUpdate = updateResponse.manifestUpdateResponsePart?.update

    Assert.assertNotNull(resultUpdate)
    Assert.assertTrue(resultUpdate!!.manifest.isVerified())
  }

  @Test
  fun testManifestParsing_MultipartBodySigned() = runTest {
    val boundary = "blah"

    val headersMap = mapOf(
      "expo-protocol-version" to "0",
      "expo-sfv-version" to "0"
    )

    val extensions = "{}"
    val directive = CertificateFixtures.testDirectiveNoUpdateAvailable

    val response = MultipartBody.Builder(boundary)
      .setType(MultipartBody.MIXED)
      .addFormDataPart("extraneous", "hello1", "hello".toRequestBody("text/plain; charset=utf-8".toMediaTypeOrNull()))
      .addPart(
        mapOf(
          "Content-Disposition" to "form-data; name=\"manifest\"; filename=\"hello2\"",
          "expo-signature" to CertificateFixtures.testExpoUpdatesManifestBodySignature
        )
          .toHeaders(),
        CertificateFixtures.testExpoUpdatesManifestBody.toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())
      )
      .addFormDataPart("extensions", "hello3", extensions.toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull()))
      .addPart(
        mapOf(
          "Content-Disposition" to "form-data; name=\"directive\"; filename=\"hello3\"",
          "expo-signature" to CertificateFixtures.testDirectiveNoUpdateAvailableSignature
        )
          .toHeaders(),
        directive.toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())
      )
      .build()
      .asResponse(headersMap.toHeaders())

    val testCertificate = getTestCertificate(TestCertificateType.VALID)
    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test"),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_CERTIFICATE to testCertificate,
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_METADATA to mapOf<String, String>()
      )
    )

    val fileDownloader = createFileDownloader(configuration)
    val resultUpdateResponse = fileDownloader.parseRemoteUpdateResponse(response)

    Assert.assertNotNull(resultUpdateResponse)
    Assert.assertTrue(resultUpdateResponse.manifestUpdateResponsePart!!.update.manifest.isVerified())

    Assert.assertNotNull(resultUpdateResponse.directiveUpdateResponsePart)
    Assert.assertTrue(resultUpdateResponse.directiveUpdateResponsePart!!.updateDirective is UpdateDirective.NoUpdateAvailableUpdateDirective)
  }

  @Test
  fun testManifestParsing_JSONBodySigned_UnsignedRequest() = runTest {
    val headersMap = mapOf(
      "expo-protocol-version" to "0",
      "expo-sfv-version" to "0"
    )

    val response = CertificateFixtures.testExpoUpdatesManifestBody.asJSONResponse(headersMap.toHeaders())

    val testCertificate = getTestCertificate(TestCertificateType.VALID)
    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test"),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_CERTIFICATE to testCertificate,
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_METADATA to mapOf<String, String>()
      )
    )

    try {
      val fileDownloader = createFileDownloader(configuration)
      fileDownloader.parseRemoteUpdateResponse(response)
    } catch (e: Exception) {
      Assert.assertEquals("Code signing verification failed for manifest: No expo-signature header specified", e.localizedMessageWithCauseLocalizedMessage())
    }
  }

  @Test
  fun testManifestParsing_MultipartBodySignedCertificateParticularExperience() = runTest {
    val boundary = "blah"

    val headersMap = mapOf(
      "expo-protocol-version" to "0",
      "expo-sfv-version" to "0"
    )

    val extensions = "{}"
    val directive = CertificateFixtures.testDirectiveNoUpdateAvailable

    val leafCert = getTestCertificate(TestCertificateType.CHAIN_LEAF)
    val intermediateCert = getTestCertificate(TestCertificateType.CHAIN_INTERMEDIATE)
    val rootCert = getTestCertificate(TestCertificateType.CHAIN_ROOT)

    val response = MultipartBody.Builder(boundary)
      .setType(MultipartBody.MIXED)
      .addFormDataPart("extraneous", "hello1", "hello".toRequestBody("text/plain; charset=utf-8".toMediaTypeOrNull()))
      .addPart(
        mapOf(
          "Content-Disposition" to "form-data; name=\"manifest\"; filename=\"hello2\"",
          "expo-signature" to CertificateFixtures.testExpoUpdatesManifestBodyValidChainLeafSignature
        )
          .toHeaders(),
        CertificateFixtures.testExpoUpdatesManifestBody.toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())
      )
      .addFormDataPart("extensions", "hello3", extensions.toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull()))
      .addFormDataPart("certificate_chain", "toHeaders", (leafCert + intermediateCert).toRequestBody("application/x-pem-file; charset=utf-8".toMediaTypeOrNull()))
      .addPart(
        mapOf(
          "Content-Disposition" to "form-data; name=\"directive\"; filename=\"hello3\"",
          "expo-signature" to CertificateFixtures.testDirectiveNoUpdateAvailableValidChainLeafSignature
        )
          .toHeaders(),
        directive.toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())
      )
      .build()
      .asResponse(headersMap.toHeaders())

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

    val fileDownloader = createFileDownloader(configuration)
    val resultUpdateResponse = fileDownloader.parseRemoteUpdateResponse(response)

    Assert.assertNotNull(resultUpdateResponse.manifestUpdateResponsePart?.update)
    Assert.assertTrue(resultUpdateResponse.manifestUpdateResponsePart?.update!!.manifest.isVerified())

    Assert.assertNotNull(resultUpdateResponse.directiveUpdateResponsePart)
    Assert.assertTrue(resultUpdateResponse.directiveUpdateResponsePart!!.updateDirective is UpdateDirective.NoUpdateAvailableUpdateDirective)
  }

  @Test
  fun testManifestParsing_MultipartBodySignedCertificateParticularExperience_IncorrectExperienceInManifest() = runTest {
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

    val response = MultipartBody.Builder(boundary)
      .setType(MultipartBody.MIXED)
      .addFormDataPart("extraneous", "hello1", "hello".toRequestBody("text/plain; charset=utf-8".toMediaTypeOrNull()))
      .addPart(
        mapOf(
          "Content-Disposition" to "form-data; name=\"manifest\"; filename=\"hello2\"",
          "expo-signature" to CertificateFixtures.testExpoUpdatesManifestBodyValidChainLeafSignatureIncorrectProjectId
        )
          .toHeaders(),
        CertificateFixtures.testExpoUpdatesManifestBodyIncorrectProjectId.toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())
      )
      .addFormDataPart("extensions", "hello3", extensions.toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull()))
      .addFormDataPart("certificate_chain", "toHeaders", (leafCert + intermediateCert).toRequestBody("application/x-pem-file; charset=utf-8".toMediaTypeOrNull()))
      .build()
      .asResponse(headersMap.toHeaders())

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

    try {
      val fileDownloader = createFileDownloader(configuration)
      fileDownloader.parseRemoteUpdateResponse(
        response
      )
    } catch (e: Exception) {
      Assert.assertEquals("Code signing verification failed for manifest: Code signing certificate project ID or scope key does not match project ID or scope key in response", e.localizedMessageWithCauseLocalizedMessage())
    }
  }

  @Test
  fun testManifestParsing_MultipartBodySignedCertificateParticularExperience_IncorrectExperienceInDirective() = runTest {
    val boundary = "blah"

    val headersMap = mapOf(
      "expo-protocol-version" to "0",
      "expo-sfv-version" to "0"
    )

    val directive = CertificateFixtures.testDirectiveNoUpdateAvailableIncorrectProjectId

    val leafCert = getTestCertificate(TestCertificateType.CHAIN_LEAF)
    val intermediateCert = getTestCertificate(TestCertificateType.CHAIN_INTERMEDIATE)
    val rootCert = getTestCertificate(TestCertificateType.CHAIN_ROOT)

    val response = MultipartBody.Builder(boundary)
      .setType(MultipartBody.MIXED)
      .addFormDataPart("extraneous", "hello1", "hello".toRequestBody("text/plain; charset=utf-8".toMediaTypeOrNull()))
      .addFormDataPart("certificate_chain", "toHeaders", (leafCert + intermediateCert).toRequestBody("application/x-pem-file; charset=utf-8".toMediaTypeOrNull()))
      .addPart(
        mapOf(
          "Content-Disposition" to "form-data; name=\"directive\"; filename=\"hello3\"",
          "expo-signature" to CertificateFixtures.testDirectiveNoUpdateAvailableValidChainLeafSignatureIncorrectProjectId
        )
          .toHeaders(),
        directive.toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())
      )
      .build()
      .asResponse(headersMap.toHeaders())

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

    try {
      val fileDownloader = createFileDownloader(configuration)
      fileDownloader.parseRemoteUpdateResponse(response)
    } catch (e: Exception) {
      Assert.assertEquals("Code signing verification failed for directive: Code signing certificate project ID or scope key does not match project ID or scope key in response part", e.localizedMessageWithCauseLocalizedMessage())
    }
  }

  @Test
  fun testManifestParsing_JSONBodySigned_UnsignedRequest_ManifestSignatureOptional() = runTest {
    val headersMap = mapOf(
      "expo-protocol-version" to "0",
      "expo-sfv-version" to "0"
    )
    val response = CertificateFixtures.testExpoUpdatesManifestBody.asJSONResponse(headersMap.toHeaders())

    val configuration = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://exp.host/@test/test"),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_CERTIFICATE to getTestCertificate(TestCertificateType.VALID),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_METADATA to mapOf<String, String>(),
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_ALLOW_UNSIGNED_MANIFESTS to true
      )
    )

    var resultUpdate: Update? = null

    val fileDownloader = createFileDownloader(configuration)
    val updateResponse = fileDownloader.parseRemoteUpdateResponse(
      response
    )
    resultUpdate = updateResponse.manifestUpdateResponsePart?.update
    Assert.assertNotNull(resultUpdate)
  }

  private fun createFileDownloader(config: UpdatesConfiguration): FileDownloader {
    val filesDirectory = temporaryFolder.newFolder()
    val loggerDirectory = temporaryFolder.newFolder()
    return FileDownloader(
      filesDirectory,
      easClientID = "test-eas-client-id",
      configuration = config,
      logger = UpdatesLogger(loggerDirectory)
    )
  }
}
