package expo.modules.updates.loader

import android.net.Uri
import expo.modules.core.logging.localizedMessageWithCauseLocalizedMessage
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.ManifestMetadata
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.unmockkObject
import kotlinx.coroutines.test.runTest
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import okio.Buffer
import okio.BufferedSource
import org.json.JSONException
import org.json.JSONObject
import org.junit.Assert
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File
import java.util.*

@RunWith(RobolectricTestRunner::class)
class FileDownloaderTest {
  private lateinit var logger: UpdatesLogger

  @get:Rule
  val temporaryFolder = TemporaryFolder()

  @Before
  fun setup() {
    logger = UpdatesLogger(temporaryFolder.newFolder())
  }

  @Test
  fun testCacheControl() {
    val configMap = mapOf<String, Any>(
      "updateUrl" to Uri.parse("https://u.expo.dev/00000000-0000-0000-0000-000000000000"),
      "runtimeVersion" to "1.0"
    )
    val config = UpdatesConfiguration(null, configMap)
    val fileDownloader = createFileDownloader(config)
    val actual = fileDownloader.createRequestForRemoteUpdate(null, config, logger)
    Assert.assertNull(actual.header("Cache-Control"))
  }

  @Test
  @Throws(JSONException::class)
  fun testExtraHeaders_ObjectTypes() {
    val configMap = mapOf<String, Any>(
      "updateUrl" to Uri.parse("https://u.expo.dev/00000000-0000-0000-0000-000000000000"),
      "runtimeVersion" to "1.0"

    )
    val config = UpdatesConfiguration(null, configMap)
    val extraHeaders = JSONObject().apply {
      put("expo-string", "test")
      put("expo-number", 47.5)
      put("expo-boolean", true)
      put("expo-null", JSONObject.NULL)
    }

    // manifest extraHeaders should have their values coerced to strings
    val fileDownloader = createFileDownloader(config)
    val actual = fileDownloader.createRequestForRemoteUpdate(extraHeaders, config, logger)
    Assert.assertEquals("test", actual.header("expo-string"))
    Assert.assertEquals("47.5", actual.header("expo-number"))
    Assert.assertEquals("true", actual.header("expo-boolean"))
    Assert.assertEquals("null", actual.header(("expo-null")))
  }

  @Test
  @Throws(JSONException::class)
  fun testExtraHeaders_OverrideOrder() {
    // custom headers configured at build-time should be able to override preset headers
    val headersMap = mapOf("expo-updates-environment" to "custom")
    val configMap = mapOf<String, Any>(
      "updateUrl" to Uri.parse("https://u.expo.dev/00000000-0000-0000-0000-000000000000"),
      "runtimeVersion" to "1.0",
      "requestHeaders" to headersMap
    )

    val config = UpdatesConfiguration(null, configMap)

    // serverDefinedHeaders should not be able to override preset headers
    val extraHeaders = JSONObject()
    extraHeaders.put("expo-platform", "ios")

    val fileDownloader = createFileDownloader(config)
    val actual = fileDownloader.createRequestForRemoteUpdate(extraHeaders, config, logger)
    Assert.assertEquals("android", actual.header("expo-platform"))
    Assert.assertEquals("custom", actual.header("expo-updates-environment"))
  }

  @Test
  @Throws(JSONException::class)
  fun testAssetExtraHeaders_OverrideOrder() {
    // custom headers configured at build-time should be able to override preset headers
    val headersMap = mapOf("expo-updates-environment" to "custom")
    val configMap = mapOf<String, Any>(
      "updateUrl" to Uri.parse("https://u.expo.dev/00000000-0000-0000-0000-000000000000"),
      "runtimeVersion" to "1.0",
      "requestHeaders" to headersMap
    )

    val config = UpdatesConfiguration(null, configMap)

    val assetEntity = AssetEntity("test", "jpg").apply {
      url = Uri.parse("https://example.com")
      extraRequestHeaders = JSONObject().apply { put("expo-platform", "ios") }
    }

    // assetRequestHeaders should not be able to override preset headers
    val fileDownloader = createFileDownloader(config)
    val actual = fileDownloader.createRequestForAsset(assetEntity, JSONObject("{}"), config)
    Assert.assertEquals("android", actual.header("expo-platform"))
    Assert.assertEquals("custom", actual.header("expo-updates-environment"))
  }

  @Test
  @Throws(JSONException::class)
  fun testAssetExtraHeaders_ObjectTypes() {
    val configMap = mapOf<String, Any>(
      "updateUrl" to Uri.parse("https://u.expo.dev/00000000-0000-0000-0000-000000000000"),
      "runtimeVersion" to "1.0"
    )

    val config = UpdatesConfiguration(null, configMap)

    val extraHeaders = JSONObject().apply {
      put("expo-string", "test")
      put("expo-number", 47.5)
      put("expo-boolean", true)
      put("expo-null", JSONObject.NULL)
    }

    val assetEntity = AssetEntity("test", "jpg").apply {
      url = Uri.parse("https://example.com")
      extraRequestHeaders = extraHeaders
    }

    // assetRequestHeaders should have their values coerced to strings
    val actual = createFileDownloader(config).createRequestForAsset(assetEntity, JSONObject("{}"), config)
    Assert.assertEquals("test", actual.header("expo-string"))
    Assert.assertEquals("47.5", actual.header("expo-number"))
    Assert.assertEquals("true", actual.header("expo-boolean"))
    Assert.assertEquals("null", actual.header("expo-null"))
  }

  @Test
  fun testGetExtraHeaders() {
    mockkObject(ManifestMetadata)
    every { ManifestMetadata.getServerDefinedHeaders(any(), any()) } returns null
    every { ManifestMetadata.getExtraParams(any(), any()) } returns mapOf("hello" to "world", "what" to "123")

    val launchedUpdateUUIDString = "7c1d2bd0-f88b-454d-998c-7fa92a924dbf"
    val launchedUpdate = UpdateEntity(UUID.fromString(launchedUpdateUUIDString), Date(), "1.0", "test", JSONObject("{}"), Uri.parse("https://u.expo.dev/00000000-0000-0000-0000-000000000000"), null)
    val embeddedUpdateUUIDString = "9433b1ed-4006-46b8-8aa7-fdc7eeb203fd"
    val embeddedUpdate = UpdateEntity(UUID.fromString(embeddedUpdateUUIDString), Date(), "1.0", "test", JSONObject("{}"), null, null)

    val mockDatabase = mockk<UpdatesDatabase> {
      every { updateDao() } returns mockk {
        every { loadRecentUpdateIdsWithFailedLaunch() } returns listOf(
          UUID.fromString("39242af2-7424-46cb-a89b-464bb9779dbd"),
          UUID.fromString("905e8320-eb1d-4d18-b061-45bc3d3dd441")
        )
      }
    }

    val extraHeaders = FileDownloader.getExtraHeadersForRemoteUpdateRequest(mockDatabase, mockk(), launchedUpdate, embeddedUpdate)

    Assert.assertEquals(launchedUpdateUUIDString, extraHeaders.get("Expo-Current-Update-ID"))
    Assert.assertEquals(embeddedUpdateUUIDString, extraHeaders.get("Expo-Embedded-Update-ID"))
    Assert.assertEquals("hello=\"world\", what=\"123\"", extraHeaders.get("Expo-Extra-Params"))
    Assert.assertEquals("\"39242af2-7424-46cb-a89b-464bb9779dbd\", \"905e8320-eb1d-4d18-b061-45bc3d3dd441\"", extraHeaders.get("Expo-Recent-Failed-Update-IDs"))

    // cleanup
    unmockkObject(ManifestMetadata)
  }

  @Test
  fun testGetExtraHeaders_NoLaunchedOrEmbeddedUpdate() {
    mockkObject(ManifestMetadata)
    every { ManifestMetadata.getServerDefinedHeaders(any(), any()) } returns null

    val mockDatabase = mockk<UpdatesDatabase> {
      every { updateDao() } returns mockk {
        every { loadRecentUpdateIdsWithFailedLaunch() } returns listOf(
          UUID.fromString("39242af2-7424-46cb-a89b-464bb9779dbd"),
          UUID.fromString("905e8320-eb1d-4d18-b061-45bc3d3dd441")
        )
      }
    }

    val extraHeaders = FileDownloader.getExtraHeadersForRemoteUpdateRequest(mockDatabase, mockk(), null, null)
    Assert.assertFalse(extraHeaders.has("Expo-Current-Update-ID"))
    Assert.assertFalse(extraHeaders.has("Expo-Embedded-Update-ID"))
    Assert.assertFalse(extraHeaders.has("Expo-Extra-Params"))
    Assert.assertEquals("\"39242af2-7424-46cb-a89b-464bb9779dbd\", \"905e8320-eb1d-4d18-b061-45bc3d3dd441\"", extraHeaders.get("Expo-Recent-Failed-Update-IDs"))

    // cleanup
    unmockkObject(ManifestMetadata)
  }

  @Test
  fun test_downloadAsset_mismatchedAssetHash() = runTest {
    val configMap = mapOf<String, Any>(
      UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://u.expo.dev/00000000-0000-0000-0000-000000000000"),
      UpdatesConfiguration.UPDATES_CONFIGURATION_RUNTIME_VERSION_KEY to "1.0"
    )

    val config = UpdatesConfiguration(null, configMap)

    val assetEntity = AssetEntity(UUID.randomUUID().toString(), "jpg").apply {
      url = Uri.parse("https://example.com")
      extraRequestHeaders = JSONObject().apply { put("expo-platform", "ios") }
      expectedHash = "badhash"
    }

    val client = mockk<OkHttpClient> {
      every { newCall(any()) } returns mockk {
        every { execute() } returns mockk {
          every { isSuccessful } returns true
          every { body } returns "hello".toResponseBody("text/plain; charset=utf-8".toMediaTypeOrNull())
        }
      }
    }

    try {
      FileDownloader(temporaryFolder.newFolder(), "eas-client-id-test", config, logger, client).downloadAsset(
        assetEntity,
        File(temporaryFolder.newFolder(), "test"),
        JSONObject("{}")
      )
      Assert.fail("Expected exception to be thrown")
    } catch (e: Exception) {
      Assert.assertTrue(e.localizedMessageWithCauseLocalizedMessage().contains("File download was successful but base64url-encoded SHA-256 did not match expected"))
    }
  }

  @Test
  fun test_downloadAsset_nullExpectedAssetHash() = runTest {
    val configMap = mapOf<String, Any>(
      UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://u.expo.dev/00000000-0000-0000-0000-000000000000"),
      UpdatesConfiguration.UPDATES_CONFIGURATION_RUNTIME_VERSION_KEY to "1.0"
    )

    val config = UpdatesConfiguration(null, configMap)

    val assetEntity = AssetEntity(UUID.randomUUID().toString(), "jpg").apply {
      url = Uri.parse("https://example.com")
      extraRequestHeaders = JSONObject().apply { put("expo-platform", "ios") }
    }

    val client = mockk<OkHttpClient> {
      every { newCall(any()) } returns mockk {
        every { execute() } returns mockk {
          every { isSuccessful } returns true
          every { body } returns "hello".toResponseBody("text/plain; charset=utf-8".toMediaTypeOrNull())
        }
      }
    }

    val result = FileDownloader(temporaryFolder.newFolder(), "eas-test-client-id", config, logger, client).downloadAsset(
      assetEntity,
      File(temporaryFolder.newFolder(), "test"),
      JSONObject("{}")
    )

    Assert.assertNotNull(result)
    Assert.assertTrue(result.isNew)
  }

  @Test
  fun test_downloadAsset_progressListener() = runTest {
    val configMap = mapOf<String, Any>(
      UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://u.expo.dev/00000000-0000-0000-0000-000000000000"),
      UpdatesConfiguration.UPDATES_CONFIGURATION_RUNTIME_VERSION_KEY to "1.0"
    )
    val config = UpdatesConfiguration(null, configMap)

    val assetEntity = AssetEntity(UUID.randomUUID().toString(), "jpg").apply {
      url = Uri.parse("https://example.com")
    }

    val responseBodyContent = "hello world"
    val client = mockk<OkHttpClient> {
      every { newCall(any()) } returns mockk {
        every { execute() } returns Response.Builder()
          .request(Request.Builder().url("https://example.com").build())
          .protocol(Protocol.HTTP_1_1)
          .code(200)
          .message("OK")
          .body(responseBodyContent.toResponseBody("text/plain; charset=utf-8".toMediaTypeOrNull()))
          .build()
      }
    }

    val fileDownloader = FileDownloader(temporaryFolder.newFolder(), "eas-client-id-test", config, logger, client)

    val progressValues = mutableListOf<Double>()
    val assetLoadProgressListener: (Double) -> Unit = { progress: Double ->
      progressValues.add(progress)
    }

    fileDownloader.downloadAsset(
      assetEntity,
      File(temporaryFolder.newFolder(), "test"),
      JSONObject("{}"),
      assetLoadProgressListener
    )

    Assert.assertTrue("Progress listener should have been called", progressValues.isNotEmpty())
    Assert.assertEquals("Last progress value should be 1.0", 1.0, progressValues.last(), 0.001)
    // Check if values are increasing
    for (i in 0 until progressValues.size - 1) {
      Assert.assertTrue(progressValues[i] <= progressValues[i + 1])
    }
  }

  @Test
  fun test_downloadAsset_progressListener_noContentLength() = runTest {
    val configMap = mapOf<String, Any>(
      UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://u.expo.dev/00000000-0000-0000-0000-000000000000"),
      UpdatesConfiguration.UPDATES_CONFIGURATION_RUNTIME_VERSION_KEY to "1.0"
    )
    val config = UpdatesConfiguration(null, configMap)

    val assetEntity = AssetEntity(UUID.randomUUID().toString(), "jpg").apply {
      url = Uri.parse("https://example.com")
    }

    val responseBodyContent = "hello world"
    val responseBodyWithoutLength = object : ResponseBody() {
      val buffer = Buffer().writeUtf8(responseBodyContent)
      override fun contentLength(): Long = -1L
      override fun contentType(): MediaType? = "text/plain; charset=utf-8".toMediaTypeOrNull()
      override fun source(): BufferedSource = buffer
    }

    val client = mockk<OkHttpClient> {
      every { newCall(any()) } returns mockk {
        every { execute() } returns Response.Builder()
          .request(Request.Builder().url("https://example.com").build())
          .protocol(Protocol.HTTP_1_1)
          .code(200)
          .message("OK")
          .body(responseBodyWithoutLength)
          .build()
      }
    }

    val fileDownloader = FileDownloader(temporaryFolder.newFolder(), "eas-client-id-test", config, logger, client)

    val progressValues = mutableListOf<Double>()
    val assetLoadProgressListener: (Double) -> Unit = { progress: Double ->
      progressValues.add(progress)
    }

    fileDownloader.downloadAsset(
      assetEntity,
      File(temporaryFolder.newFolder(), "test"),
      JSONObject("{}"),
      assetLoadProgressListener
    )

    Assert.assertTrue("Progress listener should not have been called", progressValues.isEmpty())
  }

  private fun createFileDownloader(config: UpdatesConfiguration): FileDownloader {
    val filesDirectory = temporaryFolder.newFolder()
    return FileDownloader(
      filesDirectory,
      easClientID = "test-eas-client-id",
      configuration = config,
      logger = logger
    )
  }
}
