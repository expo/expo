package expo.modules.updates.loader

import android.net.Uri
import androidx.room.Room
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.manifests.core.EmbeddedManifest
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.db.enums.UpdateStatus
import kotlinx.coroutines.test.runTest
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.EmbeddedUpdate
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
import java.security.NoSuchAlgorithmException

@RunWith(AndroidJUnit4ClassRunner::class)
class EmbeddedLoaderTest {
  private lateinit var db: UpdatesDatabase
  private lateinit var configuration: UpdatesConfiguration
  private lateinit var logger: UpdatesLogger
  private lateinit var manifest: Update
  private lateinit var loader: EmbeddedLoader
  private lateinit var loaderWithCopyAssets: EmbeddedLoader
  private lateinit var mockLoaderFiles: LoaderFiles

  @Before
  @Throws(JSONException::class)
  fun setup() {
    val configMap = mapOf<String, Any>(
      "updateUrl" to Uri.parse("https://exp.host/@test/test"),
      "runtimeVersion" to "1.0"
    )
    configuration = UpdatesConfiguration(null, configMap)
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    logger = UpdatesLogger(context.filesDir)
    db = Room.inMemoryDatabaseBuilder(context, UpdatesDatabase::class.java).build()
    mockLoaderFiles = mockk(relaxed = true)
    loader = EmbeddedLoader(
      context,
      configuration,
      logger,
      db,
      File("testDirectory"),
      mockLoaderFiles,
      shouldCopyEmbeddedAssets = false
    )
    loaderWithCopyAssets = EmbeddedLoader(
      context,
      configuration,
      logger,
      db,
      File("testDirectory"),
      mockLoaderFiles,
      shouldCopyEmbeddedAssets = true
    )
    manifest = EmbeddedUpdate.fromEmbeddedManifest(
      EmbeddedManifest(JSONObject("{\"id\":\"c3c47024-0e03-4cb4-8e8b-1a0ba2260be6\",\"commitTime\":1630374791665,\"assets\":[{\"name\":\"robot-dev\",\"type\":\"png\",\"scale\":1,\"packagerHash\":\"54da1e9816c77e30ebc5920e256736f2\",\"subdirectory\":\"/assets\",\"scales\":[1],\"resourcesFilename\":\"robotdev\",\"resourcesFolder\":\"drawable\"}]}")),
      configuration
    )

    every { mockLoaderFiles.readEmbeddedUpdate(any(), any()) } returns manifest
    every { mockLoaderFiles.copyAssetAndGetHash(any(), any(), any()) } answers { callOriginal() } // test for exception cases
  }

  @Test
  @Throws(IOException::class, NoSuchAlgorithmException::class)
  fun testEmbeddedLoader_SimpleCase() = runTest {
    val result = loader.load { _ ->
      Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
    }

    Assert.assertNotNull(result.updateEntity)

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size.toLong())
    Assert.assertEquals(UpdateStatus.READY, updates[0].status)

    val assets = db.assetDao().loadAllAssets()
    Assert.assertEquals(2, assets.size.toLong())
  }

  @Test
  @Throws(JSONException::class, IOException::class, NoSuchAlgorithmException::class)
  fun testEmbeddedLoader_MultipleScales() = runTest {
    val multipleScalesManifest: Update = EmbeddedUpdate.fromEmbeddedManifest(
      EmbeddedManifest(JSONObject("{\"id\":\"d26d7f92-c7a6-4c44-9ada-4804eda7e6e2\",\"commitTime\":1630435460610,\"assets\":[{\"name\":\"robot-dev\",\"type\":\"png\",\"scale\":1,\"packagerHash\":\"54da1e9816c77e30ebc5920e256736f2\",\"subdirectory\":\"/assets\",\"scales\":[1,2,3],\"resourcesFilename\":\"robotdev\",\"resourcesFolder\":\"drawable\"},{\"name\":\"robot-dev\",\"type\":\"png\",\"scale\":2,\"packagerHash\":\"4ecff55cf37460b7f768dc7b72bcea6b\",\"subdirectory\":\"/assets\",\"scales\":[1,2,3],\"resourcesFilename\":\"robotdev\",\"resourcesFolder\":\"drawable\"}]}")),
      configuration
    )

    every { mockLoaderFiles.readEmbeddedUpdate(any(), any()) } returns multipleScalesManifest

    val result = loader.load { _ ->
      Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
    }

    Assert.assertNotNull(result.updateEntity)

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size.toLong())
    Assert.assertEquals(UpdateStatus.READY, updates[0].status)

    val assets = db.assetDao().loadAllAssets()
    Assert.assertEquals(3, assets.size.toLong())
  }

  @Test
  @Throws(JSONException::class, IOException::class, NoSuchAlgorithmException::class)
  fun testEmbeddedLoader_MultipleScales_ReverseOrder() = runTest {
    val multipleScalesManifest: Update = EmbeddedUpdate.fromEmbeddedManifest(
      EmbeddedManifest(JSONObject("{\"id\":\"d26d7f92-c7a6-4c44-9ada-4804eda7e6e2\",\"commitTime\":1630435460610,\"assets\":[{\"name\":\"robot-dev\",\"type\":\"png\",\"scale\":2,\"packagerHash\":\"4ecff55cf37460b7f768dc7b72bcea6b\",\"subdirectory\":\"/assets\",\"scales\":[1,2],\"resourcesFilename\":\"robotdev\",\"resourcesFolder\":\"drawable\"},{\"name\":\"robot-dev\",\"type\":\"png\",\"scale\":1,\"packagerHash\":\"54da1e9816c77e30ebc5920e256736f2\",\"subdirectory\":\"/assets\",\"scales\":[1,2],\"resourcesFilename\":\"robotdev\",\"resourcesFolder\":\"drawable\"}]}")),
      configuration
    )

    every { mockLoaderFiles.readEmbeddedUpdate(any(), any()) } returns multipleScalesManifest

    val result = loader.load { _ ->
      Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
    }

    Assert.assertNotNull(result.updateEntity)

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size.toLong())
    Assert.assertEquals(UpdateStatus.READY, updates[0].status)

    val assets = db.assetDao().loadAllAssets()
    Assert.assertEquals(3, assets.size.toLong())
  }

  @Test
  @Throws(IOException::class, NoSuchAlgorithmException::class)
  fun testEmbeddedLoaderWithCopyAssets_FailureToCopyAssets() = runTest {
    every { mockLoaderFiles.copyAssetAndGetHash(any(), any(), any()) } throws IOException("mock failed to copy asset")

    try {
      loaderWithCopyAssets.load { _ ->
        Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
      }
    } catch (e: Exception) {
      Assert.assertEquals("mock failed to copy asset", e.message)
    }

    verify(atLeast = 1) { mockLoaderFiles.copyAssetAndGetHash(any(), any(), any()) }

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size.toLong())
    Assert.assertEquals(UpdateStatus.EMBEDDED, updates[0].status)

    val assets = db.assetDao().loadAllAssets()
    Assert.assertEquals(0, assets.size.toLong())
  }

  @Test
  @Throws(IOException::class, NoSuchAlgorithmException::class)
  fun testEmbeddedLoaderWithCopyAssets_AssetExists_BothDbAndDisk() = runTest {
    // return true when asked if file 54da1e9816c77e30ebc5920e256736f2 exists
    every { mockLoaderFiles.fileExists(any(), any(), any()) } answers {
      thirdArg<String>().contains("54da1e9816c77e30ebc5920e256736f2")
    }

    val existingAsset = AssetEntity("54da1e9816c77e30ebc5920e256736f2", "png")
    existingAsset.relativePath = "54da1e9816c77e30ebc5920e256736f2.png"
    db.assetDao().insertAssetForTest(existingAsset)

    val result = loaderWithCopyAssets.load { _ ->
      Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
    }

    Assert.assertNotNull(result.updateEntity)

    // only 1 asset (bundle) should be copied since the other asset already exists
    verify(exactly = 1) { mockLoaderFiles.copyAssetAndGetHash(any(), any(), any()) }

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size.toLong())
    Assert.assertEquals(UpdateStatus.READY, updates[0].status)

    val assets = db.assetDao().loadAllAssets()
    Assert.assertEquals(2, assets.size.toLong())
  }

  @Test
  @Throws(IOException::class, NoSuchAlgorithmException::class)
  fun testEmbeddedLoaderWithCopyAssets_AssetExists_DbOnly() = runTest {
    // return true when asked if file 54da1e9816c77e30ebc5920e256736f2 exists
    every { mockLoaderFiles.fileExists(any(), any(), any()) } returns false

    val existingAsset = AssetEntity("54da1e9816c77e30ebc5920e256736f2", "png")
    existingAsset.relativePath = "54da1e9816c77e30ebc5920e256736f2.png"
    db.assetDao().insertAssetForTest(existingAsset)

    val result = loaderWithCopyAssets.load { _ ->
      Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
    }

    Assert.assertNotNull(result.updateEntity)

    // both assets should be copied regardless of what the database says
    verify(exactly = 2) { mockLoaderFiles.copyAssetAndGetHash(any(), any(), any()) }
    // the resource asset should make it through to the inner copy method
    verify(exactly = 1) { mockLoaderFiles.copyResourceAndGetHash(any(), any(), any()) }

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size.toLong())
    Assert.assertEquals(UpdateStatus.READY, updates[0].status)

    val assets = db.assetDao().loadAllAssets()
    Assert.assertEquals(2, assets.size.toLong())
  }

  @Test
  @Throws(IOException::class, NoSuchAlgorithmException::class)
  fun testEmbeddedLoaderWithCopyAssets_AssetExists_DiskOnly() = runTest {
    // return true when asked if file 54da1e9816c77e30ebc5920e256736f2 exists
    every { mockLoaderFiles.fileExists(any(), any(), any()) } answers {
      thirdArg<String>().contains("54da1e9816c77e30ebc5920e256736f2")
    }

    Assert.assertEquals(0, db.assetDao().loadAllAssets().size.toLong())

    val result = loaderWithCopyAssets.load { _ ->
      Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
    }

    Assert.assertNotNull(result.updateEntity)

    // only 1 asset (bundle) should be copied since the other asset already exists
    verify(exactly = 1) { mockLoaderFiles.copyAssetAndGetHash(any(), any(), any()) }

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size.toLong())
    Assert.assertEquals(UpdateStatus.READY, updates[0].status)

    // both assets should have been added to the db even though one already existed on disk
    val assets = db.assetDao().loadAllAssets()
    Assert.assertEquals(2, assets.size.toLong())
  }

  @Test
  @Throws(IOException::class, NoSuchAlgorithmException::class)
  fun testEmbeddedLoader_UpdateExists_Ready() = runTest {
    val update = UpdateEntity(
      manifest.updateEntity!!.id,
      manifest.updateEntity!!.commitTime,
      manifest.updateEntity!!.runtimeVersion,
      manifest.updateEntity!!.scopeKey,
      manifest.updateEntity!!.manifest,
      null,
      null
    )
    update.status = UpdateStatus.READY
    db.updateDao().insertUpdate(update)

    val result = loader.load { _ ->
      Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
    }

    Assert.assertNotNull(result.updateEntity)
    verify(exactly = 0) { mockLoaderFiles.copyAssetAndGetHash(any(), any(), any()) }

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size.toLong())
    Assert.assertEquals(UpdateStatus.READY, updates[0].status)
  }

  @Test
  @Throws(IOException::class, NoSuchAlgorithmException::class)
  fun testEmbeddedLoader_UpdateExists_Pending() = runTest {
    val update = UpdateEntity(
      manifest.updateEntity!!.id,
      manifest.updateEntity!!.commitTime,
      manifest.updateEntity!!.runtimeVersion,
      manifest.updateEntity!!.scopeKey,
      manifest.updateEntity!!.manifest,
      null,
      null
    )
    update.status = UpdateStatus.PENDING
    db.updateDao().insertUpdate(update)

    val result = loader.load { _ ->
      Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
    }

    Assert.assertNotNull(result.updateEntity)

    val updates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, updates.size.toLong())
    Assert.assertEquals(UpdateStatus.READY, updates[0].status)

    val assets = db.assetDao().loadAllAssets()
    Assert.assertEquals(2, assets.size.toLong())
  }
}
