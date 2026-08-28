package expo.modules.updates.loader

import android.content.Context
import android.net.Uri
import androidx.room.Room
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.manifests.core.ExpoUpdatesManifest
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.enums.UpdateStatus
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.ExpoUpdatesUpdate
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.test.runTest
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.util.UUID

/**
 * Loads an update with many assets downloading concurrently on real IO threads. The loader's
 * bookkeeping collections are mutated from every download job, so this fails if they are ever
 * reverted to unsynchronized collections: assets silently vanish from the database and the
 * update is marked READY without them, which bricks the app at launch.
 */
@RunWith(AndroidJUnit4ClassRunner::class)
class LoaderStressTest {
  private lateinit var context: Context
  private lateinit var configuration: UpdatesConfiguration
  private lateinit var logger: UpdatesLogger

  @Before
  fun setup() {
    context = InstrumentationRegistry.getInstrumentation().targetContext
    configuration = UpdatesConfiguration(
      null,
      mapOf<String, Any>(
        "updateUrl" to Uri.parse("https://exp.host/@test/test"),
        "runtimeVersion" to "1"
      )
    )
    logger = UpdatesLogger(context.filesDir)
  }

  @Test
  fun testRemoteLoader_ManyConcurrentAssetDownloads_RegistersEveryAsset() = runTest {
    repeat(ITERATIONS) {
      val db = Room.inMemoryDatabaseBuilder(context, UpdatesDatabase::class.java).build()
      try {
        val manifest = ExpoUpdatesUpdate.fromExpoUpdatesManifest(
          ExpoUpdatesManifest(JSONObject(manifestBodyWithAssets(ASSET_COUNT))),
          null,
          configuration
        )

        val mockFileDownloader = mockk<FileDownloader>()
        coEvery { mockFileDownloader.downloadRemoteUpdate(any()) } returns UpdateResponse(
          responseHeaderData = null,
          manifestUpdateResponsePart = UpdateResponsePart.ManifestUpdateResponsePart(manifest),
          directiveUpdateResponsePart = null
        )
        coEvery { mockFileDownloader.downloadAsset(any(), any(), any(), any(), any(), any()) } coAnswers {
          // jitter so download completions overlap instead of serializing
          delay((0..2).random().toLong())
          FileDownloader.AssetDownloadResult(firstArg<AssetEntity>(), true)
        }

        val loader = RemoteLoader(
          context,
          configuration,
          logger,
          db,
          mockFileDownloader,
          File("testDirectory"),
          null,
          mockk(relaxed = true),
          CoroutineScope(SupervisorJob() + Dispatchers.IO)
        )

        val result = loader.load {
          Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
        }

        Assert.assertNotNull(result.updateEntity)

        val updates = db.updateDao().loadAllUpdates()
        Assert.assertEquals(1, updates.size)
        Assert.assertEquals(UpdateStatus.READY, updates[0].status)
        Assert.assertNotNull(db.updateDao().loadLaunchAssetForUpdate(updates[0].id))
        Assert.assertEquals(ASSET_COUNT + 1, db.assetDao().loadAllAssets().size)
      } finally {
        db.close()
      }
    }
  }

  private fun manifestBodyWithAssets(count: Int): String {
    val assets = JSONArray()
    for (i in 0 until count) {
      assets.put(
        JSONObject().apply {
          put("hash", "hash-$i")
          put("key", "asset-$i.jpg")
          put("contentType", "image/jpeg")
          put("url", "http://192.168.64.1:3000/api/assets?asset=$i")
          put("fileExtension", ".jpg")
        }
      )
    }
    return JSONObject().apply {
      put("id", UUID.randomUUID().toString())
      put("createdAt", "2021-11-23T00:57:14.437Z")
      put("runtimeVersion", "1")
      put("assets", assets)
      put(
        "launchAsset",
        JSONObject().apply {
          put("hash", "hash-bundle")
          put("key", "bundle.js")
          put("contentType", "application/javascript")
          put("url", "http://192.168.64.1:3000/api/assets?asset=bundle")
          put("fileExtension", ".bundle")
        }
      )
      put("extra", JSONObject().apply { put("scopeKey", "@test/app") })
    }.toString()
  }

  companion object {
    private const val ASSET_COUNT = 100
    private const val ITERATIONS = 5
  }
}
