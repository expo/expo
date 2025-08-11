package expo.modules.updates.loader

import android.net.Uri
import androidx.room.Room
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.manifests.core.ExpoUpdatesManifest
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.codesigning.*
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.db.enums.UpdateStatus
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.ExpoUpdatesUpdate
import expo.modules.updates.manifest.Update
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.json.JSONException
import org.json.JSONObject
import org.junit.Assert
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.io.IOException
import java.util.*

@RunWith(AndroidJUnit4ClassRunner::class)
class RemoteLoaderTest {
  private lateinit var db: UpdatesDatabase
  private lateinit var configuration: UpdatesConfiguration
  private lateinit var logger: UpdatesLogger
  private lateinit var manifest: Update
  private lateinit var loader: RemoteLoader
  private lateinit var mockLoaderFiles: LoaderFiles
  private lateinit var mockFileDownloader: FileDownloader

  @Before
  @Throws(JSONException::class)
  fun setup() = runTest {
    val configMap = mapOf<String, Any>(
      "updateUrl" to Uri.parse("https://exp.host/@test/test"),
      "runtimeVersion" to "1.0"
    )
    configuration = UpdatesConfiguration(null, configMap)
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    logger = UpdatesLogger(context.filesDir)
    db = Room.inMemoryDatabaseBuilder(context, UpdatesDatabase::class.java).build()
    mockLoaderFiles = mockk(relaxed = true)
    mockFileDownloader = mockk()
    loader = RemoteLoader(
      context,
      configuration,
      logger,
      db,
      mockFileDownloader,
      File("testDirectory"),
      null,
      mockLoaderFiles
    )

    val manifestString = CertificateFixtures.testExpoUpdatesManifestBody
    manifest = ExpoUpdatesUpdate.fromExpoUpdatesManifest(ExpoUpdatesManifest(JSONObject(manifestString)), null, configuration)

    coEvery { mockFileDownloader.downloadRemoteUpdate(any()) } returns UpdateResponse(
      responseHeaderData = null,
      manifestUpdateResponsePart = UpdateResponsePart.ManifestUpdateResponsePart(manifest),
      directiveUpdateResponsePart = null
    )

    coEvery { mockFileDownloader.downloadAsset(any(), any(), any(), any()) } answers {
      val asset = firstArg<AssetEntity>()
      FileDownloader.AssetDownloadResult(asset, true)
    }
  }

  @Test
  fun testRemoteLoader_SimpleCase() = runTest {
    val result = loader.load {
      Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
    }

    Assert.assertNotNull(result.updateEntity)
    coVerify(exactly = 2) { mockFileDownloader.downloadAsset(any(), any(), any(), any()) }

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size)
    Assert.assertEquals(UpdateStatus.READY, updates[0].status)
    val assets = db.assetDao().loadAllAssets()
    Assert.assertEquals(2, assets.size)
  }

  @Test
  fun testRemoteLoader_FailureToDownloadAssets() = runTest {
    coEvery { mockFileDownloader.downloadAsset(any(), any(), any(), any()) } throws IOException("mock failed to download asset")

    try {
      loader.load { _ ->
        Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
      }
    } catch (e: IOException) {
      Assert.assertEquals("mock failed to download asset", e.message)
    }

    coVerify(atLeast = 1) { mockFileDownloader.downloadAsset(any(), any(), any(), any()) }

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size)
    Assert.assertEquals(UpdateStatus.PENDING, updates[0].status)
    val assets = db.assetDao().loadAllAssets()
    Assert.assertEquals(0, assets.size)
  }

  @Test
  fun testRemoteLoader_AssetExists_BothDbAndDisk() = runTest {
    // return true when asked if file 54da1e9816c77e30ebc5920e256736f2 exists on disk
    every { mockLoaderFiles.fileExists(any(), any(), any()) } answers {
      thirdArg<String>().contains("489ea2f19fa850b65653ab445637a181")
    }

    val existingAsset = AssetEntity("489ea2f19fa850b65653ab445637a181.jpg", ".jpg")
    existingAsset.relativePath = "489ea2f19fa850b65653ab445637a181.jpg"
    db.assetDao().insertAssetForTest(existingAsset)

    val result = loader.load { _ ->
      Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
    }

    Assert.assertNotNull(result.updateEntity)

    // only 1 asset (bundle) should be downloaded since the other asset already exists
    coVerify(exactly = 1) { mockFileDownloader.downloadAsset(any(), any(), any(), any()) }

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size)
    Assert.assertEquals(UpdateStatus.READY, updates[0].status)
    val assets = db.assetDao().loadAllAssets()
    Assert.assertEquals(2, assets.size)

    // ensure the asset in the DB was updated with the URL from the manifest
    assets.forEach { Assert.assertNotNull(it.url) }
  }

  @Test
  fun testRemoteLoader_AssetExists_DbOnly() = runTest {
    // return false when asked if file 489ea2f19fa850b65653ab445637a181 exists on disk
    every { mockLoaderFiles.fileExists(any(), any(), any()) } returns false

    val existingAsset = AssetEntity("489ea2f19fa850b65653ab445637a181.jpg", ".jpg")
    existingAsset.relativePath = "489ea2f19fa850b65653ab445637a181.jpg"
    existingAsset.url = Uri.parse("http://example.com")
    db.assetDao().insertAssetForTest(existingAsset)

    val result = loader.load { _ ->
      Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
    }

    Assert.assertNotNull(result.updateEntity)

    // both assets should be downloaded regardless of what the database says
    coVerify(exactly = 2) { mockFileDownloader.downloadAsset(any(), any(), any(), any()) }

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size)
    Assert.assertEquals(UpdateStatus.READY, updates[0].status)
    val assets = db.assetDao().loadAllAssets()
    Assert.assertEquals(2, assets.size)

    // ensure the asset in the DB was updated with the URL from the manifest
    assets.forEach {
      Assert.assertNotNull(it.url)
      Assert.assertEquals(it.url!!.host, "192.168.64.1")
    }
  }

  @Test
  fun testRemoteLoader_UpdateExists_Ready() = runTest {
    val update = UpdateEntity(
      manifest.updateEntity!!.id,
      manifest.updateEntity!!.commitTime,
      manifest.updateEntity!!.runtimeVersion,
      manifest.updateEntity!!.scopeKey,
      manifest.updateEntity!!.manifest,
      Uri.parse("https://exp.host/@test/test"),
      null
    )
    update.status = UpdateStatus.READY
    db.updateDao().insertUpdate(update)

    val result = loader.load { _ ->
      Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
    }

    Assert.assertNotNull(result.updateEntity)
    coVerify(exactly = 0) { mockFileDownloader.downloadAsset(any(), any(), any(), any()) }

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size)
    Assert.assertEquals(UpdateStatus.READY, updates[0].status)
  }

  @Test
  fun testRemoteLoader_UpdateExists_Pending() = runTest {
    val update = UpdateEntity(
      manifest.updateEntity!!.id,
      manifest.updateEntity!!.commitTime,
      manifest.updateEntity!!.runtimeVersion,
      manifest.updateEntity!!.scopeKey,
      manifest.updateEntity!!.manifest,
      Uri.parse("https://exp.host/@test/test"),
      null
    )
    update.status = UpdateStatus.PENDING
    db.updateDao().insertUpdate(update)

    val result = loader.load { _ ->
      Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
    }

    Assert.assertNotNull(result.updateEntity)

    // missing assets should still be downloaded
    coVerify(exactly = 2) { mockFileDownloader.downloadAsset(any(), any(), any(), any()) }

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size)
    Assert.assertEquals(UpdateStatus.READY, updates[0].status)
    val assets = db.assetDao().loadAllAssets()
    Assert.assertEquals(2, assets.size)
  }

  @Test
  fun testRemoteLoader_UpdateExists_DifferentScopeKey() = runTest {
    val update = UpdateEntity(
      manifest.updateEntity!!.id,
      manifest.updateEntity!!.commitTime,
      manifest.updateEntity!!.runtimeVersion,
      "differentScopeKey",
      manifest.updateEntity!!.manifest,
      Uri.parse("https://exp.host/@test-different-scope/test"),
      null
    )
    update.status = UpdateStatus.READY
    db.updateDao().insertUpdate(update)

    val result = loader.load { _ ->
      Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
    }

    Assert.assertNotNull(result.updateEntity)
    coVerify(exactly = 0) { mockFileDownloader.downloadAsset(any(), any(), any(), any()) }

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size)
    Assert.assertEquals(UpdateStatus.READY, updates[0].status)
    Assert.assertEquals(manifest.updateEntity!!.scopeKey, updates[0].scopeKey)
  }

  @Test
  @Throws(JSONException::class)
  fun testRemoteLoader_DevelopmentModeManifest() = runTest {
    val manifestString =
      "{\"metadata\":{},\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"},\"extra\":{\"expoGo\":{\"developer\":{\"tool\":\"expo-cli\",\"projectRoot\":\"/Users/eric/expo/updates-unit-test-template\"},\"packagerOpts\":{\"scheme\":null,\"hostType\":\"lan\",\"lanType\":\"ip\",\"dev\":true,\"minify\":false,\"urlRandomness\":null,\"https\":false}}}}"
    manifest = ExpoUpdatesUpdate.fromExpoUpdatesManifest(ExpoUpdatesManifest(JSONObject(manifestString)), null, configuration)

    coEvery { mockFileDownloader.downloadRemoteUpdate(any()) } returns UpdateResponse(
      responseHeaderData = null,
      manifestUpdateResponsePart = UpdateResponsePart.ManifestUpdateResponsePart(manifest),
      directiveUpdateResponsePart = null
    )

    val result = loader.load { _ ->
      Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
    }

    Assert.assertNotNull(result.updateEntity)
    coVerify(exactly = 0) { mockFileDownloader.downloadAsset(any(), any(), any(), any()) }

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size)
    Assert.assertEquals(UpdateStatus.DEVELOPMENT, updates[0].status)
  }

  @Test
  fun testRemoteLoader_RollBackDirective() = runTest {
    val updateDirective = UpdateDirective.RollBackToEmbeddedUpdateDirective(commitTime = Date(), signingInfo = null)
    coEvery { mockFileDownloader.downloadRemoteUpdate(any()) } returns UpdateResponse(
      responseHeaderData = null,
      manifestUpdateResponsePart = null,
      directiveUpdateResponsePart = UpdateResponsePart.DirectiveUpdateResponsePart(updateDirective)
    )

    val result = loader.load { _ ->
      Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = false)
    }

    Assert.assertEquals(updateDirective, result.updateDirective)
    Assert.assertNull(result.updateEntity)
    coVerify(exactly = 0) { mockFileDownloader.downloadAsset(any(), any(), any(), any()) }

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(0, updates.size)
  }

  @Test
  fun testRemoteLoader_SendsProgress() = runTest {
    val progressUpdates = mutableListOf<Double>()
    loader.assetLoadProgressBlock = { progress ->
      progressUpdates.add(progress)
    }

    loader.load {
      Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
    }

    coVerify(exactly = 2) { mockFileDownloader.downloadAsset(any(), any(), any(), any()) }

    Assert.assertEquals(2, progressUpdates.size)
    Assert.assertEquals(0.5, progressUpdates[0], 0.001)
    Assert.assertEquals(1.0, progressUpdates[1], 0.001)
  }
}
