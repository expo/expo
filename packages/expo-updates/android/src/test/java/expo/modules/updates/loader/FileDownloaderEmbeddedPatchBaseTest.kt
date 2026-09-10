package expo.modules.updates.loader

import android.content.Context
import android.net.Uri
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import expo.modules.manifests.core.EmbeddedManifest
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.EmbeddedUpdate
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import okhttp3.OkHttpClient
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
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File
import java.util.Date
import java.util.UUID

/**
 * Covers bsdiff patch application when the launched update is the embedded update, which is the
 * case on every fresh install.
 *
 * The embedded update is registered by the real [EmbeddedLoader] into a real database, so what
 * these tests feed to [FileDownloader] is whatever the loader actually writes — not a hand-built
 * approximation of it. Only two things are faked, both because a JVM test has no APK to read:
 * [LoaderFiles.readEmbeddedUpdate] returns a synthetic embedded manifest, and
 * [LoaderFiles.copyAssetAndGetHash] writes the fixture bytes instead of unpacking them.
 *
 * Scope: these tests cover patch *base resolution*, not bsdiff itself. `applyPatch` is stubbed
 * because Robolectric cannot load the native library; `HermesDiffTest` covers the real patcher.
 * So the meaningful signals here are whether a base was resolved, which bytes the patcher was
 * handed, and how many times the asset was fetched.
 */
@RunWith(RobolectricTestRunner::class)
class FileDownloaderEmbeddedPatchBaseTest {
  @get:Rule
  val temporaryFolder = TemporaryFolder()

  private lateinit var context: Context
  private lateinit var configuration: UpdatesConfiguration
  private lateinit var logger: UpdatesLogger
  private lateinit var db: UpdatesDatabase
  private lateinit var loaderFiles: LoaderFiles
  private lateinit var filesDirectory: File
  private lateinit var updatesDirectory: File
  private lateinit var server: MockWebServer

  private lateinit var baseBytes: ByteArray
  private lateinit var patchedBytes: ByteArray
  private lateinit var patchBytes: ByteArray
  private lateinit var patchedHash: String

  @Before
  fun setUp() {
    context = ApplicationProvider.getApplicationContext()
    configuration = UpdatesConfiguration(
      null,
      mapOf(
        "updateUrl" to Uri.parse("https://u.expo.dev/00000000-0000-0000-0000-000000000000"),
        "runtimeVersion" to "1.0",
        "enableBsdiffPatchSupport" to true
      )
    )
    logger = UpdatesLogger(temporaryFolder.newFolder("logs"))
    filesDirectory = temporaryFolder.newFolder("files")
    updatesDirectory = temporaryFolder.newFolder("updates")
    // Robolectric runs these on the main thread; the loader and downloader query synchronously.
    db = Room.inMemoryDatabaseBuilder(context, UpdatesDatabase::class.java)
      .allowMainThreadQueries()
      .build()
    server = MockWebServer()
    server.start()

    baseBytes = loadFixture("old.hbc")
    patchedBytes = loadFixture("new.hbc")
    patchBytes = loadFixture("test.patch")
    patchedHash = UpdatesUtils.toBase64Url(
      UpdatesUtils.sha256(temporaryFolder.newFile("expected-patched.hbc").apply { writeBytes(patchedBytes) })
    )

    val embeddedManifest = EmbeddedUpdate.fromEmbeddedManifest(
      EmbeddedManifest(
        JSONObject(
          """{"id":"${UUID.randomUUID()}","commitTime":1630374791665,"assets":[]}"""
        )
      ),
      configuration
    )
    loaderFiles = mockk(relaxed = true)
    every { loaderFiles.readEmbeddedUpdate(any(), any()) } returns embeddedManifest
    // Stands in for unpacking the bundle out of the APK, which a JVM test has no access to.
    every { loaderFiles.copyAssetAndGetHash(any(), any(), any()) } answers {
      val destination = secondArg<File>()
      destination.parentFile?.mkdirs()
      destination.writeBytes(baseBytes)
      UpdatesUtils.sha256(destination)
    }
  }

  @After
  fun tearDown() {
    server.shutdown()
    db.close()
  }

  /**
   * Repro. With EX_UPDATES_COPY_EMBEDDED_ASSETS off (the default) the embedded bundle is never
   * copied into the updates directory, so [FileDownloader.preparePatchBaseAsset] cannot resolve a
   * base and the patch is discarded.
   */
  @Test
  fun `patch applies when the launched update is the embedded update`() = runTest {
    val launchedUpdate = registerEmbeddedUpdate(shouldCopyEmbeddedAssets = false)

    val result = runPatchDownload(launchedUpdate)

    assertTrue("expected the patch to be applied against a resolved base", result.patchWasApplied)
    assertEquals("expected a single request, no fallback", 1, result.requestCount)
  }

  /**
   * Control. Registering the same embedded update with copying enabled puts the bundle in the
   * updates directory, which is the only difference between this and the test above.
   */
  @Test
  fun `patch applies when the embedded update was registered with copying enabled`() = runTest {
    val launchedUpdate = registerEmbeddedUpdate(shouldCopyEmbeddedAssets = true)

    val result = runPatchDownload(launchedUpdate)

    assertTrue("expected the patch to be applied against a resolved base", result.patchWasApplied)
    assertArrayEquals(
      "expected the embedded bundle itself to be the patch base",
      baseBytes,
      result.baseBytesSeenByPatcher
    )
    assertEquals("expected a single request, no fallback", 1, result.requestCount)
  }

  /**
   * Pins today's cost: the device downloads the patch, discards it, and downloads the whole bundle
   * on top of it. Delete this test when the repro above goes green.
   */
  @Test
  fun `embedded base currently costs a patch download plus a full bundle download`() = runTest {
    val launchedUpdate = registerEmbeddedUpdate(shouldCopyEmbeddedAssets = false)

    val result = runPatchDownload(launchedUpdate)

    assertFalse("patch base was never resolved", result.patchWasApplied)
    assertEquals("patch request, then full bundle request", 2, result.requestCount)
    assertArrayEquals("device ends up with the full bundle", patchedBytes, result.destinationBytes)

    val fallbackRequest = server.takeRequest()
    assertNull("the fallback request does not ask for a patch", fallbackRequest.getHeader("A-IM"))
  }

  /**
   * Runs the real [EmbeddedLoader] and returns the update it registered. The launch asset row and
   * its relativePath are whatever the loader wrote, so these tests observe production behaviour
   * rather than restating it.
   */
  private suspend fun registerEmbeddedUpdate(shouldCopyEmbeddedAssets: Boolean): UpdateEntity {
    val loader = EmbeddedLoader(
      context,
      configuration,
      logger,
      db,
      updatesDirectory,
      loaderFiles,
      shouldCopyEmbeddedAssets = shouldCopyEmbeddedAssets
    )
    val result = loader.load {
      Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
    }
    val updateEntity = result.updateEntity
    assertNotNull("EmbeddedLoader should have registered the embedded update", updateEntity)
    assertNotNull(
      "EmbeddedLoader should have recorded a launch asset",
      db.updateDao().loadLaunchAssetForUpdate(updateEntity!!.id)
    )
    return updateEntity
  }

  private class PatchDownloadResult(
    val destinationBytes: ByteArray,
    val requestCount: Int,
    val patchWasApplied: Boolean,
    val baseBytesSeenByPatcher: ByteArray?
  )

  /**
   * Answers the launch asset request the way EAS Update's edge does — 226 with `im: bsdiff` and
   * `expo-base-update-id` naming the launched update — and queues a full bundle behind it, which
   * is only consumed if the client gives up on the patch.
   */
  private suspend fun runPatchDownload(launchedUpdate: UpdateEntity): PatchDownloadResult {
    val requestedUpdate = UpdateEntity(
      id = UUID.randomUUID(),
      commitTime = Date(),
      runtimeVersion = "1.0",
      scopeKey = launchedUpdate.scopeKey,
      manifest = JSONObject(),
      url = null,
      requestHeaders = emptyMap()
    )

    server.enqueue(
      MockResponse()
        .setResponseCode(226)
        .setHeader("Content-Type", "application/vnd.bsdiff")
        .setHeader("im", "bsdiff")
        .setHeader("expo-base-update-id", launchedUpdate.id.toString().lowercase())
        .setBody(Buffer().write(patchBytes))
    )
    server.enqueue(
      MockResponse()
        .setResponseCode(200)
        .setHeader("Content-Type", "*/*")
        .setBody(Buffer().write(patchedBytes))
    )

    val asset = AssetEntity("new-bundle", "hbc").apply {
      url = Uri.parse(server.url("/bundle.hbc").toString())
      isLaunchAsset = true
    }

    // On a fresh install the launched update is the embedded update, so both headers name it.
    val extraHeaders = FileDownloader.getExtraHeadersForRemoteAssetRequest(
      launchedUpdate = launchedUpdate,
      embeddedUpdate = launchedUpdate,
      requestedUpdate = requestedUpdate
    )

    val downloader =
      FileDownloader(filesDirectory, "test-eas-client", configuration, logger, db, OkHttpClient())

    // bsdiff is a native library and cannot run under Robolectric. The stub records the base it
    // was given, which is what these tests are actually about; HermesDiffTest covers the patcher.
    var baseBytesSeenByPatcher: ByteArray? = null
    downloader.applyPatch = { baseFilePath, newFilePath, _ ->
      baseBytesSeenByPatcher = File(baseFilePath).readBytes()
      File(newFilePath).writeBytes(patchedBytes)
      0
    }

    val destination = File(updatesDirectory, "downloaded.hbc")
    downloader.downloadAssetAndVerifyHashAndWriteToPath(
      asset = asset,
      extraHeaders = extraHeaders,
      request = downloader.createRequestForAsset(asset, extraHeaders, configuration, allowPatch = true),
      expectedBase64URLEncodedSHA256Hash = patchedHash,
      destination = destination,
      updatesDirectory = updatesDirectory,
      progressListener = null,
      allowPatch = true,
      launchedUpdate = launchedUpdate,
      requestedUpdate = requestedUpdate
    )

    assertEquals("bsdiff", server.takeRequest().getHeader("A-IM"))

    return PatchDownloadResult(
      destinationBytes = destination.readBytes(),
      requestCount = server.requestCount,
      patchWasApplied = baseBytesSeenByPatcher != null,
      baseBytesSeenByPatcher = baseBytesSeenByPatcher
    )
  }

  private fun loadFixture(name: String): ByteArray {
    val stream = javaClass.classLoader?.getResourceAsStream(name) ?: error("Missing fixture: $name")
    return stream.use { it.readBytes() }
  }
}
