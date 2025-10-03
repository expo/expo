package expo.modules.updates.loader

import android.net.Uri
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.dao.UpdateDao
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.logging.UpdatesLogger
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.ResponseBody.Companion.toResponseBody
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okio.Buffer
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File
import java.io.IOException
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

  @Before
  fun setUp() {
    val config = mapOf<String, Any>(
      "updateUrl" to Uri.parse("https://u.expo.dev/00000000-0000-0000-0000-000000000000"),
      "runtimeVersion" to "1.0"
    )
    configuration = UpdatesConfiguration(null, config)
    logger = UpdatesLogger(temporaryFolder.newFolder("logs"))
    filesDirectory = temporaryFolder.newFolder("files")
    updatesDirectory = temporaryFolder.newFolder("updates")
    server = MockWebServer()
    server.start()
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
    }

    val downloader = FileDownloader(filesDirectory, "test-eas-client", configuration, logger, OkHttpClient())
    val request = downloader.createRequestForAsset(asset, JSONObject(), configuration)
    val destination = File(updatesDirectory, "downloaded.hbc")

    val result = downloader.downloadAssetAndVerifyHashAndWriteToPath(
      asset = asset,
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
        .setResponseCode(200)
        .setHeader("Content-Type", "application/vnd.bsdiff")
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
    }

    val downloader = FileDownloader(filesDirectory, "test-eas-client", configuration, logger, OkHttpClient())
    val request = downloader.createRequestForAsset(asset, JSONObject(), configuration)
    val destination = File(updatesDirectory, "downloaded.hbc")

    val result = downloader.downloadAssetAndVerifyHashAndWriteToPath(
      asset = asset,
      request = request,
      expectedBase64URLEncodedSHA256Hash = expectedHash,
      destination = destination,
      updatesDirectory = updatesDirectory,
      progressListener = null
    )

    assertArrayEquals(expectedBytes, result.hash)
    assertArrayEquals(fallback, destination.readBytes())

    val firstRequest = server.takeRequest()
    assertEquals("application/vnd.bsdiff,*/*", firstRequest.getHeader("Accept"))
    val secondRequest = server.takeRequest()
    assertEquals("*/*", secondRequest.getHeader("Accept"))
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
    val request = Request.Builder()
      .url("https://u.expo.dev/bundle.hbc")
      .header("Expo-Current-Update-ID", currentUpdateId.toString())
      .build()
    val response = "patch".toResponseBody("application/vnd.bsdiff".toMediaTypeOrNull())

    val context = downloader.prepareAssetForDiff(asset, request, response, updatesDirectory)
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
    val request = Request.Builder()
      .url("https://u.expo.dev/bundle.hbc")
      .header("Expo-Current-Update-ID", currentUpdateId.toString())
      .build()
    val responseBody = "patch".toResponseBody("application/vnd.bsdiff".toMediaTypeOrNull())

    assertThrows(IOException::class.java) {
      downloader.prepareAssetForDiff(asset, request, responseBody, updatesDirectory)
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

    val downloader = FileDownloader(filesDirectory, "test-eas-client", configuration, logger, OkHttpClient())
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

  private fun loadFixture(name: String): ByteArray {
    val stream = javaClass.classLoader?.getResourceAsStream(name)
      ?: error("Missing fixture: $name")
    return stream.use { it.readBytes() }
  }
}
