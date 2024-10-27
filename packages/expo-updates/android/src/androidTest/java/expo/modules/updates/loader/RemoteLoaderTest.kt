package expo.modules.updates.loader

import android.net.Uri
import androidx.room.Room
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.manifests.core.ExpoUpdatesManifest
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.codesigning.*
import expo.modules.updates.db.enums.UpdateStatus
import expo.modules.updates.loader.FileDownloader.AssetDownloadCallback
import expo.modules.updates.loader.Loader.LoaderCallback
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.ExpoUpdatesUpdate
import expo.modules.updates.manifest.Update
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
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
  private lateinit var mockCallback: LoaderCallback

  @Before
  @Throws(JSONException::class)
  fun setup() {
    val configMap = mapOf<String, Any>(
      "updateUrl" to Uri.parse("https://exp.host/@test/test"),
      "runtimeVersion" to "1.0"
    )
    configuration = UpdatesConfiguration(null, configMap)
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    logger = UpdatesLogger(context)
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

    every { mockFileDownloader.downloadRemoteUpdate(any(), any()) } answers {
      val callback = arg<FileDownloader.RemoteUpdateDownloadCallback>(1)
      callback.onSuccess(
        UpdateResponse(
          responseHeaderData = null,
          manifestUpdateResponsePart = UpdateResponsePart.ManifestUpdateResponsePart(manifest),
          directiveUpdateResponsePart = null
        )
      )
    }

    every { mockFileDownloader.downloadAsset(any(), any(), any()) } answers {
      val asset = firstArg<AssetEntity>()
      val callback = arg<AssetDownloadCallback>(2)
      callback.onSuccess(asset, true)
    }

    mockCallback = mockk(relaxUnitFun = true)
    every { mockCallback.onUpdateResponseLoaded(any()) } returns Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
  }

  @Test
  fun testRemoteLoader_SimpleCase() {
    loader.start(mockCallback)

    verify { mockCallback.onSuccess(any()) }
    verify(exactly = 0) { mockCallback.onFailure(any()) }
    verify(exactly = 2) { mockFileDownloader.downloadAsset(any(), any(), any()) }

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size)
    Assert.assertEquals(UpdateStatus.READY, updates[0].status)
    val assets = db.assetDao().loadAllAssets()
    Assert.assertEquals(2, assets.size)
  }

  @Test
  fun testRemoteLoader_FailureToDownloadAssets() {
    every { mockFileDownloader.downloadAsset(any(), any(), any()) } answers {
      val asset = firstArg<AssetEntity>()
      val callback = arg<AssetDownloadCallback>(2)
      callback.onFailure(IOException("mock failed to download asset"), asset)
    }

    loader.start(mockCallback)

    verify(exactly = 0) { mockCallback.onSuccess(any()) }
    verify { mockCallback.onFailure(any()) }
    verify(exactly = 2) { mockFileDownloader.downloadAsset(any(), any(), any()) }

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size)
    Assert.assertEquals(UpdateStatus.PENDING, updates[0].status)
    val assets = db.assetDao().loadAllAssets()
    Assert.assertEquals(0, assets.size)
  }

  @Test
  fun testRemoteLoader_AssetExists_BothDbAndDisk() {
    // return true when asked if file 54da1e9816c77e30ebc5920e256736f2 exists on disk
    every { mockLoaderFiles.fileExists(any()) } answers {
      firstArg<File>().toString().contains("489ea2f19fa850b65653ab445637a181")
    }

    val existingAsset = AssetEntity("489ea2f19fa850b65653ab445637a181.jpg", ".jpg")
    existingAsset.relativePath = "489ea2f19fa850b65653ab445637a181.jpg"
    db.assetDao().insertAssetForTest(existingAsset)
    loader.start(mockCallback)

    verify { mockCallback.onSuccess(any()) }
    verify(exactly = 0) { mockCallback.onFailure(any()) }

    // only 1 asset (bundle) should be downloaded since the other asset already exists
    verify(exactly = 1) { mockFileDownloader.downloadAsset(any(), any(), any()) }

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size)
    Assert.assertEquals(UpdateStatus.READY, updates[0].status)
    val assets = db.assetDao().loadAllAssets()
    Assert.assertEquals(2, assets.size)

    // ensure the asset in the DB was updated with the URL from the manifest
    assets.forEach { Assert.assertNotNull(it.url) }
  }

  @Test
  fun testRemoteLoader_AssetExists_DbOnly() {
    // return false when asked if file 489ea2f19fa850b65653ab445637a181 exists on disk
    every { mockLoaderFiles.fileExists(any()) } returns false

    val existingAsset = AssetEntity("489ea2f19fa850b65653ab445637a181.jpg", ".jpg")
    existingAsset.relativePath = "489ea2f19fa850b65653ab445637a181.jpg"
    existingAsset.url = Uri.parse("http://example.com")
    db.assetDao().insertAssetForTest(existingAsset)
    loader.start(mockCallback)

    verify { mockCallback.onSuccess(any()) }
    verify(exactly = 0) { mockCallback.onFailure(any()) }

    // both assets should be downloaded regardless of what the database says
    verify(exactly = 2) { mockFileDownloader.downloadAsset(any(), any(), any()) }

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
  fun testRemoteLoader_UpdateExists_Ready() {
    val update = UpdateEntity(
      manifest.updateEntity!!.id,
      manifest.updateEntity!!.commitTime,
      manifest.updateEntity!!.runtimeVersion,
      manifest.updateEntity!!.scopeKey,
      manifest.updateEntity!!.manifest
    )
    update.status = UpdateStatus.READY
    db.updateDao().insertUpdate(update)
    loader.start(mockCallback)

    verify { mockCallback.onSuccess(any()) }
    verify(exactly = 0) { mockCallback.onFailure(any()) }
    verify(exactly = 0) { mockFileDownloader.downloadAsset(any(), any(), any()) }

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size)
    Assert.assertEquals(UpdateStatus.READY, updates[0].status)
  }

  @Test
  fun testRemoteLoader_UpdateExists_Pending() {
    val update = UpdateEntity(
      manifest.updateEntity!!.id,
      manifest.updateEntity!!.commitTime,
      manifest.updateEntity!!.runtimeVersion,
      manifest.updateEntity!!.scopeKey,
      manifest.updateEntity!!.manifest
    )
    update.status = UpdateStatus.PENDING
    db.updateDao().insertUpdate(update)
    loader.start(mockCallback)

    verify { mockCallback.onSuccess(any()) }
    verify(exactly = 0) { mockCallback.onFailure(any()) }

    // missing assets should still be downloaded
    verify(exactly = 2) { mockFileDownloader.downloadAsset(any(), any(), any()) }

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size)
    Assert.assertEquals(UpdateStatus.READY, updates[0].status)
    val assets = db.assetDao().loadAllAssets()
    Assert.assertEquals(2, assets.size)
  }

  @Test
  fun testRemoteLoader_UpdateExists_DifferentScopeKey() {
    val update = UpdateEntity(
      manifest.updateEntity!!.id,
      manifest.updateEntity!!.commitTime,
      manifest.updateEntity!!.runtimeVersion,
      "differentScopeKey",
      manifest.updateEntity!!.manifest
    )
    update.status = UpdateStatus.READY
    db.updateDao().insertUpdate(update)
    loader.start(mockCallback)

    verify { mockCallback.onSuccess(any()) }
    verify(exactly = 0) { mockCallback.onFailure(any()) }
    verify(exactly = 0) { mockFileDownloader.downloadAsset(any(), any(), any()) }

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size)
    Assert.assertEquals(UpdateStatus.READY, updates[0].status)
    Assert.assertEquals(manifest.updateEntity!!.scopeKey, updates[0].scopeKey)
  }

  @Test
  @Throws(JSONException::class)
  fun testRemoteLoader_DevelopmentModeManifest() {
    val manifestString =
      "{\"metadata\":{},\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"},\"extra\":{\"expoGo\":{\"developer\":{\"tool\":\"expo-cli\",\"projectRoot\":\"/Users/eric/expo/updates-unit-test-template\"},\"packagerOpts\":{\"scheme\":null,\"hostType\":\"lan\",\"lanType\":\"ip\",\"dev\":true,\"minify\":false,\"urlRandomness\":null,\"https\":false}}}}"
    manifest = ExpoUpdatesUpdate.fromExpoUpdatesManifest(ExpoUpdatesManifest(JSONObject(manifestString)), null, configuration)

    every { mockFileDownloader.downloadRemoteUpdate(any(), any()) } answers {
      val callback = arg<FileDownloader.RemoteUpdateDownloadCallback>(1)
      callback.onSuccess(
        UpdateResponse(
          responseHeaderData = null,
          manifestUpdateResponsePart = UpdateResponsePart.ManifestUpdateResponsePart(manifest),
          directiveUpdateResponsePart = null
        )
      )
    }

    loader.start(mockCallback)

    verify { mockCallback.onSuccess(any()) }
    verify(exactly = 0) { mockCallback.onFailure(any()) }
    verify(exactly = 0) { mockFileDownloader.downloadAsset(any(), any(), any()) }

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size)
    Assert.assertEquals(UpdateStatus.DEVELOPMENT, updates[0].status)
  }

  @Test
  fun testRemoteLoader_RollBackDirective() {
    val updateDirective = UpdateDirective.RollBackToEmbeddedUpdateDirective(commitTime = Date(), signingInfo = null)
    every { mockFileDownloader.downloadRemoteUpdate(any(), any()) } answers {
      val callback = arg<FileDownloader.RemoteUpdateDownloadCallback>(1)
      callback.onSuccess(
        UpdateResponse(
          responseHeaderData = null,
          manifestUpdateResponsePart = null,
          directiveUpdateResponsePart = UpdateResponsePart.DirectiveUpdateResponsePart(updateDirective)
        )
      )
    }

    loader.start(mockCallback)

    verify { mockCallback.onSuccess(Loader.LoaderResult(null, updateDirective)) }
    verify(exactly = 0) { mockCallback.onFailure(any()) }
    verify(exactly = 0) { mockFileDownloader.downloadAsset(any(), any(), any()) }

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(0, updates.size)
  }
}
