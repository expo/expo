package expo.modules.updates.launcher

import android.content.Context
import android.text.format.DateUtils
import androidx.room.Room
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.db.enums.UpdateStatus
import expo.modules.updates.launcher.Launcher.LauncherCallback
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.selectionpolicy.SelectionPolicy
import io.mockk.every
import io.mockk.mockk
import io.mockk.spyk
import io.mockk.verify
import org.junit.After
import org.junit.Assert
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.util.*

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
  fun testGetUpdateIds_EmptyDB() {
    val launcher = DatabaseLauncher(
      UpdatesConfiguration(null, null),
      File("test"),
      FileDownloader(context),
      SelectionPolicy(
        mockk(),
        mockk(),
        mockk()
      )
    )
    val readyUpdateIds = launcher.getReadyUpdateIds(db)
    Assert.assertEquals(0, readyUpdateIds.size)
  }

  @Test
  fun testGetUpdateIds_DBWithOneUpdate() {
    val testUpdate = UpdateEntity(UUID.randomUUID(), Date(), "1.0", "scopeKey")
    testUpdate.lastAccessed = Date(Date().time - DateUtils.DAY_IN_MILLIS) // yesterday
    testUpdate.status = UpdateStatus.READY
    db.updateDao().insertUpdate(testUpdate)

    val launcher = DatabaseLauncher(
      UpdatesConfiguration(null, null),
      File("test"),
      FileDownloader(context),
      SelectionPolicy(
        mockk(),
        mockk(),
        mockk()
      )
    )
    val readyUpdateIds = launcher.getReadyUpdateIds(db)
    Assert.assertEquals(1, readyUpdateIds.size)
  }

  @Test
  fun testGetUpdateIds_DBWithOneReadyUpdate() {
    val testUpdate1 = UpdateEntity(UUID.randomUUID(), Date(), "1.0", "scopeKey")
    testUpdate1.lastAccessed = Date(Date().time - DateUtils.DAY_IN_MILLIS) // yesterday
    testUpdate1.status = UpdateStatus.READY
    db.updateDao().insertUpdate(testUpdate1)

    val testUpdate2 = UpdateEntity(UUID.randomUUID(), Date(), "1.0", "scopeKey")
    testUpdate2.lastAccessed = Date(Date().time - DateUtils.DAY_IN_MILLIS) // yesterday
    testUpdate2.status = UpdateStatus.PENDING
    db.updateDao().insertUpdate(testUpdate2)

    val launcher = DatabaseLauncher(
      UpdatesConfiguration(null, null),
      File("test"),
      FileDownloader(context),
      SelectionPolicy(
        mockk(),
        mockk(),
        mockk()
      )
    )
    val readyUpdateIds = launcher.getReadyUpdateIds(db)
    Assert.assertEquals(1, readyUpdateIds.size)
  }

  @Test
  fun testLaunch_MarkUpdateAccessed() {
    val testUpdate = UpdateEntity(UUID.randomUUID(), Date(), "1.0", "scopeKey")
    testUpdate.lastAccessed = Date(Date().time - DateUtils.DAY_IN_MILLIS) // yesterday
    db.updateDao().insertUpdate(testUpdate)

    val testAsset = AssetEntity("bundle-1234", "js")
    testAsset.relativePath = "bundle-1234"
    testAsset.isLaunchAsset = true

    db.assetDao().insertAssets(listOf(testAsset), testUpdate)

    val launcher = DatabaseLauncher(
      UpdatesConfiguration(null, null),
      File("test"),
      FileDownloader(context),
      SelectionPolicy(
        mockk(),
        mockk(),
        mockk()
      )
    )
    val spyLauncher = spyk(launcher)
    every { spyLauncher.getLaunchableUpdate(any(), any()) } returns db.updateDao().loadUpdateWithId(testUpdate.id)

    val mockedFile = File(context.cacheDir, "test")
    every { spyLauncher.ensureAssetExists(any(), any(), any()) } returns mockedFile

    val mockedCallback = mockk<LauncherCallback>(relaxed = true)

    spyLauncher.launch(db, context, mockedCallback)

    verify { mockedCallback.onSuccess() }

    val sameUpdate = db.updateDao().loadUpdateWithId(testUpdate.id)!!

    Assert.assertNotEquals(testUpdate.lastAccessed, sameUpdate.lastAccessed)
    Assert.assertTrue(
      "new lastAccessed date should be within 1000 ms of now",
      Date().time - sameUpdate.lastAccessed.time < 1000
    )
  }
}
