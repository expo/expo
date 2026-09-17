package expo.modules.updates.loader

import android.net.Uri
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.dao.UpdateDao
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.logging.UpdatesLogger
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.unmockkObject
import io.mockk.verify
import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.ResponseBody.Companion.toResponseBody
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okio.Buffer
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File
import java.io.IOException
import java.util.Date
import java.util.UUID

@RunWith(RobolectricTestRunner::class)
class FileDownloaderAssetDiffTest {
  @get:Rule
  val temporaryFolder = TemporaryFolder()

  private lateinit var configuration: UpdatesConfiguration
  private lateinit var logger: UpdatesLogger
  private lateinit var filesDirectory: File
  private lateinit var updatesDirectory: File
  private lateinit var server: MockWebServer
  private lateinit var defaultDatabase: UpdatesDatabase

  @Before
  fun setUp() {
    val config = mapOf<String, Any>(
      "updateUrl" to Uri.parse("https://u.expo.dev/00000000-0000-0000-0000-000000000000"),
      "runtimeVersion" to "1.0",
      "enableBsdiffPatchSupport" to true
    )
    configuration = UpdatesConfiguration(null, config)
    logger = UpdatesLogger(temporaryFolder.newFolder("logs"))
    filesDirectory = temporaryFolder.newFolder("files")
    updatesDirectory = temporaryFolder.newFolder("updates")
    server = MockWebServer()
    server.start()
    defaultDatabase = mockk(relaxed = true)
  }

  @After
  fun tearDown() {
    server.shutdown()
  }

  @Test
  fun downloadAssetAndVerifyHashAndWriteToPath_writesFileAndReturnsHash() = runTest {
    val responseBytes = loadFixture("new.hbc")
    val expected = temporaryFolder.newFile("expected.hbc").apply {
      writeBytes(responseBytes)
    }
    val expectedBytes = UpdatesUtils.sha256(expected)
    val expectedHash = UpdatesUtils.toBase64Url(expectedBytes)

    server.enqueue(
      MockResponse()
        .setResponseCode(200)
        .setHeader("Content-Type", "*/*")
        .setBody(Buffer().write(responseBytes))
    )

    val asset = AssetEntity("bundle", "hbc").apply {
      url = Uri.parse(server.url("/bundle.hbc").toString())
      isLaunchAsset = true
    }

    val downloader = FileDownloader(filesDirectory, "test-eas-client", configuration, logger, defaultDatabase, OkHttpClient())
    val request = downloader.createRequestForAsset(asset, JSONObject(), configuration)
    val destination = File(updatesDirectory, "downloaded.hbc")

    val result = downloader.downloadAssetAndVerifyHashAndWriteToPath(
      asset = asset,
      extraHeaders = JSONObject(),
      request = request,
      expectedBase64URLEncodedSHA256Hash = expectedHash,
      destination = destination,
      updatesDirectory = updatesDirectory,
      progressListener = null,
      allowPatch = false
    )

    assertEquals(destination, result.file)
    assertArrayEquals(expectedBytes, result.hash)
    assertArrayEquals(responseBytes, destination.readBytes())
  }

  @Test
  fun downloadAssetAndVerifyHashAndWriteToPath_fallsBackWhenPatchFails() = runTest {
    val fallback = loadFixture("new.hbc")
    val expected = temporaryFolder.newFile("fallback.hbc").apply {
      writeBytes(fallback)
    }
    val expectedBytes = UpdatesUtils.sha256(expected)
    val expectedHash = UpdatesUtils.toBase64Url(expectedBytes)

    server.enqueue(
      MockResponse()
        .setResponseCode(226)
        .setHeader("Content-Type", "application/javascript")
        .setHeader("im", "bsdiff")
        .setBody("diff")
    )

    server.enqueue(
      MockResponse()
        .setResponseCode(200)
        .setHeader("Content-Type", "*/*")
        .setBody(Buffer().write(fallback))
    )

    val asset = AssetEntity("bundle", "hbc").apply {
      url = Uri.parse(server.url("/bundle.hbc").toString())
      isLaunchAsset = true
    }

    val downloader = FileDownloader(filesDirectory, "test-eas-client", configuration, logger, defaultDatabase, OkHttpClient())
    val request = downloader.createRequestForAsset(asset, JSONObject(), configuration)
    val destination = File(updatesDirectory, "downloaded.hbc")

    val result = downloader.downloadAssetAndVerifyHashAndWriteToPath(
      asset = asset,
      extraHeaders = JSONObject(),
      request = request,
      expectedBase64URLEncodedSHA256Hash = expectedHash,
      destination = destination,
      updatesDirectory = updatesDirectory,
      progressListener = null,
      allowPatch = true
    )

    assertArrayEquals(expectedBytes, result.hash)
    assertArrayEquals(fallback, destination.readBytes())

    val firstRequest = server.takeRequest()
    assertEquals("bsdiff", firstRequest.getHeader("A-IM"))
    val secondRequest = server.takeRequest()
    assertEquals("*/*", secondRequest.getHeader("Accept"))
    assertNull(secondRequest.getHeader("A-IM"))
  }

  @Test
  fun downloadAssetAndVerifyHashAndWriteToPath_missingPatchHeadersFallsBackToFullAsset() = runTest {
    val fallbackBytes = loadFixture("new.hbc")
    val expectedFile = temporaryFolder.newFile("expected.hbc").apply {
      writeBytes(fallbackBytes)
    }
    val expectedHashBytes = UpdatesUtils.sha256(expectedFile)
    val expectedHash = UpdatesUtils.toBase64Url(expectedHashBytes)

    server.enqueue(
      MockResponse()
        .setResponseCode(226)
        .setHeader("Content-Type", "application/javascript")
        .setHeader("im", "bsdiff")
        .setBody("diff")
    )

    server.enqueue(
      MockResponse()
        .setResponseCode(200)
        .setHeader("Content-Type", "*/*")
        .setBody(Buffer().write(fallbackBytes))
    )

    val asset = AssetEntity("bundle", "hbc").apply {
      url = Uri.parse(server.url("/bundle.hbc").toString())
      isLaunchAsset = true
    }

    val launchedUpdate = createUpdate(UUID.randomUUID())
    val requestedUpdate = createUpdate(UUID.randomUUID())
    val extraHeaders = FileDownloader.getExtraHeadersForRemoteAssetRequest(
      launchedUpdate = launchedUpdate,
      embeddedUpdate = null,
      requestedUpdate = requestedUpdate
    )

    val downloader = FileDownloader(
      filesDirectory,
      "test-eas-client",
      configuration,
      logger,
      defaultDatabase,
      OkHttpClient()
    )
    val request = downloader.createRequestForAsset(
      asset,
      extraHeaders,
      configuration,
      allowPatch = true
    )
    val destination = File(updatesDirectory, "missing-headers.hbc")

    val result = downloader.downloadAssetAndVerifyHashAndWriteToPath(
      asset = asset,
      extraHeaders = extraHeaders,
      request = request,
      expectedBase64URLEncodedSHA256Hash = expectedHash,
      destination = destination,
      updatesDirectory = updatesDirectory,
      progressListener = null,
      allowPatch = true,
      launchedUpdate = launchedUpdate,
      requestedUpdate = requestedUpdate
    )

    assertArrayEquals(expectedHashBytes, result.hash)
    assertArrayEquals(fallbackBytes, destination.readBytes())

    val firstRequest = server.takeRequest()
    assertEquals("bsdiff", firstRequest.getHeader("A-IM"))

    val secondRequest = server.takeRequest()
    assertNull(secondRequest.getHeader("A-IM"))
  }

  @Test
  fun prepareAssetForDiff_returnsLaunchAssetContextWhenHashesMatch() {
    val currentUpdateId = UUID.randomUUID()
    val baseRelativePath = "bundles/base.hbc"
    val baseFile = File(updatesDirectory, baseRelativePath)
    baseFile.parentFile?.mkdirs()
    baseFile.writeBytes(loadFixture("old.hbc"))
    val expectedBaseHash = UpdatesUtils.toBase64Url(UpdatesUtils.sha256(baseFile))

    val launchEntity = AssetEntity("launch", "hbc").apply {
      relativePath = baseRelativePath
      expectedHash = expectedBaseHash
    }

    val updateDao = mockk<UpdateDao> {
      every { loadLaunchAssetForUpdate(currentUpdateId) } returns launchEntity
    }
    val database = mockk<UpdatesDatabase> {
      every { updateDao() } returns updateDao
    }
    val downloader = FileDownloader(filesDirectory, "test-eas-client", configuration, logger, database)

    val asset = AssetEntity("new", "hbc").apply { isLaunchAsset = true }
    val response = "patch".toResponseBody("application/vnd.bsdiff".toMediaTypeOrNull())

    val launchedUpdate = createUpdate(currentUpdateId)
    val context = downloader.prepareAssetForDiff(asset, response, patchDestination(), updatesDirectory, launchedUpdate)
    assertEquals(baseFile, context.baseFile)
  }

  @Test
  fun prepareAssetForDiff_throwsWhenHashesMismatch() {
    val currentUpdateId = UUID.randomUUID()
    val baseRelativePath = "bundles/base.hbc"
    val baseFile = File(updatesDirectory, baseRelativePath)
    baseFile.parentFile?.mkdirs()
    baseFile.writeBytes(loadFixture("old.hbc"))

    val mismatchSource = temporaryFolder.newFile("expected-mismatch.hbc").apply {
      writeBytes(loadFixture("new.hbc"))
    }

    val launchEntity = AssetEntity("launch", "hbc").apply {
      relativePath = baseRelativePath
      expectedHash = UpdatesUtils.toBase64Url(UpdatesUtils.sha256(mismatchSource))
    }

    val updateDao = mockk<UpdateDao> {
      every { loadLaunchAssetForUpdate(currentUpdateId) } returns launchEntity
    }
    val database = mockk<UpdatesDatabase> {
      every { updateDao() } returns updateDao
    }
    val downloader = FileDownloader(filesDirectory, "test-eas-client", configuration, logger, database)

    val asset = AssetEntity("new", "hbc").apply { isLaunchAsset = true }
    val responseBody = "patch".toResponseBody("application/vnd.bsdiff".toMediaTypeOrNull())

    val launchedUpdate = createUpdate(currentUpdateId)
    assertThrows(IOException::class.java) {
      downloader.prepareAssetForDiff(asset, responseBody, patchDestination(), updatesDirectory, launchedUpdate)
    }
  }

  @Test
  fun prepareAssetForDiff_skipsTheBaseHashWhenTheRowHasNoExpectedHash() {
    val currentUpdateId = UUID.randomUUID()
    val baseRelativePath = "bundles/base.hbc"
    val baseFile = File(updatesDirectory, baseRelativePath)
    baseFile.parentFile?.mkdirs()
    baseFile.writeBytes(loadFixture("old.hbc"))

    val launchEntity = AssetEntity("launch", "hbc").apply {
      relativePath = baseRelativePath
      expectedHash = null
    }
    val updateDao = mockk<UpdateDao> {
      every { loadLaunchAssetForUpdate(currentUpdateId) } returns launchEntity
    }
    val database = mockk<UpdatesDatabase> {
      every { updateDao() } returns updateDao
    }
    val downloader = FileDownloader(filesDirectory, "test-eas-client", configuration, logger, database)
    val asset = AssetEntity("new", "hbc").apply { isLaunchAsset = true }
    val response = "patch".toResponseBody("application/vnd.bsdiff".toMediaTypeOrNull())

    mockkObject(UpdatesUtils)
    try {
      val context = downloader.prepareAssetForDiff(asset, response, patchDestination(), updatesDirectory, createUpdate(currentUpdateId))
      assertEquals(baseFile, context.baseFile)
      verify(exactly = 0) { UpdatesUtils.sha256(any<File>()) }
    } finally {
      unmockkObject(UpdatesUtils)
    }
  }

  @Test
  fun applyHermesDiff_writesPatchedFileAndValidatesHash() {
    val baseFile = File(updatesDirectory, "base.hbc")
    baseFile.parentFile?.mkdirs()
    baseFile.writeBytes(loadFixture("old.hbc"))

    val patched = loadFixture("new.hbc")
    val expected = temporaryFolder.newFile("expected.hbc").apply {
      writeBytes(patched)
    }
    val expectedHashString = UpdatesUtils.toBase64Url(UpdatesUtils.sha256(expected))

    val downloader = FileDownloader(filesDirectory, "test-eas-client", configuration, logger, defaultDatabase, OkHttpClient())
    downloader.applyPatch = { _, newFilePath, patchFilePath ->
      val patchFile = File(patchFilePath)
      assertEquals("diff payload", patchFile.readText())
      File(newFilePath).writeBytes(patched)
      0
    }

    val destination = File(updatesDirectory, "patched.hbc")
    val diffBody = "diff payload".toResponseBody("application/vnd.bsdiff".toMediaTypeOrNull())
    val asset = AssetEntity("bundle", "hbc")

    val result = downloader.applyHermesDiff(
      baseFile = baseFile,
      diffBody = diffBody,
      destination = destination,
      expectedBase64URLEncodedSHA256Hash = expectedHashString,
      asset = asset,
      requestedUpdateId = "requested-update-id"
    )

    assertArrayEquals(patched, destination.readBytes())
    assertArrayEquals(UpdatesUtils.sha256(destination), result)
    // Verify clean up runs correctly
    assertFalse(File(destination.absolutePath + ".patch").exists())
    assertFalse(File(destination.absolutePath + ".patched").exists())
  }

  @Test
  fun prepareAssetForDiff_extractsEmbeddedLaunchAssetFromApk() {
    val currentUpdateId = UUID.randomUUID()
    val baseBytes = loadFixture("old.hbc")

    val launchEntity = AssetEntity("launch", "hbc").apply {
      relativePath = "file:///android_asset/index.android.bundle.js"
    }

    val updateDao = mockk<UpdateDao> {
      every { loadLaunchAssetForUpdate(currentUpdateId) } returns launchEntity
    }
    val database = mockk<UpdatesDatabase> {
      every { updateDao() } returns updateDao
    }
    val downloader = FileDownloader(filesDirectory, "test-eas-client", configuration, logger, database)

    val asset = AssetEntity("new", "hbc").apply { isLaunchAsset = true }
    val response = "patch".toResponseBody("application/vnd.bsdiff".toMediaTypeOrNull())

    var extractedInto: File? = null
    val extractor: EmbeddedAssetExtractor = { _, destination ->
      destination.parentFile?.mkdirs()
      destination.writeBytes(baseBytes)
      extractedInto = destination
    }

    val context = downloader.prepareAssetForDiff(
      asset,
      response,
      patchDestination(),
      updatesDirectory,
      createUpdate(currentUpdateId),
      extractor
    )

    assertEquals(extractedInto, context.baseFile)
    assertArrayEquals(baseBytes, context.baseFile.readBytes())
    assertTrue("the extracted base is temporary and must be cleaned up", context.isTemporary)
  }

  @Test
  fun downloadAssetAndVerifyHashAndWriteToPath_patchesAgainstTheEmbeddedBundleAndCleansUp() = runTest {
    val currentUpdateId = UUID.randomUUID()
    val baseBytes = loadFixture("old.hbc")
    val patchedBytes = loadFixture("new.hbc")
    val expected = temporaryFolder.newFile("expected-embedded.hbc").apply {
      writeBytes(patchedBytes)
    }
    val expectedHash = UpdatesUtils.toBase64Url(UpdatesUtils.sha256(expected))

    server.enqueue(
      MockResponse()
        .setResponseCode(226)
        .setHeader("Content-Type", "application/javascript")
        .setHeader("im", "bsdiff")
        .setHeader("expo-base-update-id", currentUpdateId.toString())
        .setBody("diff payload")
    )

    val launchEntity = AssetEntity("launch", "hbc").apply {
      relativePath = "file:///android_asset/index.android.bundle.js"
    }
    val updateDao = mockk<UpdateDao> {
      every { loadLaunchAssetForUpdate(currentUpdateId) } returns launchEntity
    }
    val database = mockk<UpdatesDatabase> {
      every { updateDao() } returns updateDao
    }

    val asset = AssetEntity("bundle", "hbc").apply {
      url = Uri.parse(server.url("/bundle.hbc").toString())
      isLaunchAsset = true
    }

    val downloader = FileDownloader(filesDirectory, "test-eas-client", configuration, logger, database, OkHttpClient())
    downloader.applyPatch = { baseFilePath, newFilePath, _ ->
      assertArrayEquals(baseBytes, File(baseFilePath).readBytes())
      File(newFilePath).writeBytes(patchedBytes)
      0
    }

    var extractedInto: File? = null
    var extractedFrom: AssetEntity? = null
    val extractor: EmbeddedAssetExtractor = { row, base ->
      extractedFrom = row
      base.writeBytes(baseBytes)
      extractedInto = base
    }

    val destination = File(updatesDirectory, "downloaded.hbc")
    val result = downloader.downloadAssetAndVerifyHashAndWriteToPath(
      asset = asset,
      extraHeaders = JSONObject(),
      request = downloader.createRequestForAsset(asset, JSONObject(), configuration, allowPatch = true),
      expectedBase64URLEncodedSHA256Hash = expectedHash,
      destination = destination,
      updatesDirectory = updatesDirectory,
      progressListener = null,
      allowPatch = true,
      launchedUpdate = createUpdate(currentUpdateId),
      requestedUpdate = createUpdate(UUID.randomUUID()),
      embeddedAssetExtractor = extractor
    )

    assertArrayEquals(patchedBytes, destination.readBytes())
    assertArrayEquals(UpdatesUtils.sha256(expected), result.hash)
    assertEquals("no full-bundle fallback download", 1, server.requestCount)
    assertSame(launchEntity, extractedFrom)
    assertNotNull(extractedInto)
    assertFalse("the extracted base must not be left behind", extractedInto!!.exists())
    assertFalse(File(destination.absolutePath + ".base").exists())
  }

  @Test
  fun prepareAssetForDiff_throwsForEmbeddedLaunchAssetWithoutAnExtractor() {
    val currentUpdateId = UUID.randomUUID()

    val launchEntity = AssetEntity("launch", "hbc").apply {
      relativePath = "file:///android_asset/index.android.bundle.js"
    }

    val updateDao = mockk<UpdateDao> {
      every { loadLaunchAssetForUpdate(currentUpdateId) } returns launchEntity
    }
    val database = mockk<UpdatesDatabase> {
      every { updateDao() } returns updateDao
    }
    val downloader = FileDownloader(filesDirectory, "test-eas-client", configuration, logger, database)

    val asset = AssetEntity("new", "hbc").apply { isLaunchAsset = true }
    val response = "patch".toResponseBody("application/vnd.bsdiff".toMediaTypeOrNull())

    val error = assertThrows(IOException::class.java) {
      downloader.prepareAssetForDiff(asset, response, patchDestination(), updatesDirectory, createUpdate(currentUpdateId))
    }
    assertTrue(
      "expected the message to name the missing extractor, got: ${error.message}",
      error.message!!.contains("cannot be extracted")
    )
  }

  private fun patchDestination() = File(updatesDirectory, "patched.hbc")

  private fun loadFixture(name: String): ByteArray {
    val stream = javaClass.classLoader?.getResourceAsStream(name)
      ?: error("Missing fixture: $name")
    return stream.use { it.readBytes() }
  }

  private fun createUpdate(id: UUID): UpdateEntity {
    return UpdateEntity(
      id = id,
      commitTime = Date(),
      runtimeVersion = "1.0",
      scopeKey = "test-scope",
      manifest = JSONObject(),
      url = null,
      requestHeaders = emptyMap()
    )
  }
}
