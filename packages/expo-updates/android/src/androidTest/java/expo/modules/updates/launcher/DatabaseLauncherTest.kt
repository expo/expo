package expo.modules.updates.launcher

import android.content.Context
import android.net.Uri
import android.text.format.DateUtils
import androidx.room.Room
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.selectionpolicy.SelectionPolicy
import io.mockk.coEvery
import io.mockk.mockk
import io.mockk.spyk
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runTest
import org.json.JSONObject
import org.junit.After
import org.junit.Assert
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.util.Date
import java.util.UUID

@RunWith(AndroidJUnit4ClassRunner::class)
class DatabaseLauncherTest {
  private lateinit var context: Context
  private lateinit var db: UpdatesDatabase

  @Before
  fun createDb() {
    context = InstrumentationRegistry.getInstrumentation().targetContext
    db = Room.inMemoryDatabaseBuilder(context, UpdatesDatabase::class.java).build()
  }

  @After
  fun closeDb() {
    db.close()
  }

  @Test
  fun testLaunch_MarkUpdateAccessed() = runTest {
    val testUpdate = UpdateEntity(UUID.randomUUID(), Date(), "1.0", "scopeKey", JSONObject("{}"), Uri.parse("https://example.com"), null)
    testUpdate.lastAccessed = Date(Date().time - DateUtils.DAY_IN_MILLIS) // yesterday
    db.updateDao().insertUpdate(testUpdate)

    val testAsset = AssetEntity("bundle-1234", "js")
    testAsset.relativePath = "bundle-1234"
    testAsset.isLaunchAsset = true

    db.assetDao().insertAssets(listOf(testAsset), testUpdate)

    val launcher = DatabaseLauncher(
      context,
      UpdatesConfiguration(
        null,
        mapOf(
          "updateUrl" to Uri.parse("https://example.com"),
          "hasEmbeddedUpdate" to false
        )
      ),
      File("test"),
      mockk(),
      SelectionPolicy(
        mockk(),
        mockk(),
        mockk()
      ),
      UpdatesLogger(context.filesDir),
      TestScope()
    )
    val spyLauncher = spyk(launcher)
    coEvery { spyLauncher.getLaunchableUpdate(any()) } returns db.updateDao().loadUpdateWithId(testUpdate.id)

    val mockedFile = File(context.cacheDir, "test")
    coEvery { spyLauncher.ensureAssetExists(any(), any(), any(), any()) } returns mockedFile

    spyLauncher.launch(db)

    val sameUpdate = db.updateDao().loadUpdateWithId(testUpdate.id)!!

    Assert.assertNotEquals(testUpdate.lastAccessed, sameUpdate.lastAccessed)
    Assert.assertTrue(
      "new lastAccessed date should be within 1000 ms of now",
      Date().time - sameUpdate.lastAccessed.time < 1000
    )
  }
}
