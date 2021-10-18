package expo.modules.updates.launcher

import android.content.Context
import androidx.room.Room
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.launcher.Launcher.LauncherCallback
import org.junit.After
import org.junit.Assert
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentMatchers
import org.mockito.Mockito
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
  fun testLaunch_MarkUpdateAccessed() {
    val testUpdate = UpdateEntity(UUID.randomUUID(), Date(), "1.0", "scopeKey")
    testUpdate.lastAccessed = Date(Date().time - 24 * 60 * 60 * 1000) // yesterday
    db.updateDao().insertUpdate(testUpdate)

    val testAsset = AssetEntity("bundle-1234", "js")
    testAsset.relativePath = "bundle-1234"
    testAsset.isLaunchAsset = true

    db.assetDao().insertAssets(listOf(testAsset), testUpdate)

    val launcher = DatabaseLauncher(null, null, null, null)
    val spyLauncher = Mockito.spy(launcher)
    Mockito.doReturn(db.updateDao().loadUpdateWithId(testUpdate.id))
      .`when`(spyLauncher).getLaunchableUpdate(ArgumentMatchers.any(), ArgumentMatchers.any())

    val mockedFile = File(context.cacheDir, "test")
    Mockito.doReturn(mockedFile).`when`(spyLauncher)
      .ensureAssetExists(ArgumentMatchers.any(), ArgumentMatchers.any(), ArgumentMatchers.any())

    val mockedCallback = Mockito.mock(
      LauncherCallback::class.java
    )

    spyLauncher.launch(db, context, mockedCallback)

    Mockito.verify(mockedCallback).onSuccess()

    val sameUpdate = db.updateDao().loadUpdateWithId(testUpdate.id)

    Assert.assertNotEquals(testUpdate.lastAccessed, sameUpdate.lastAccessed)
    Assert.assertTrue(
      "new lastAccessed date should be within 1000 ms of now",
      Date().time - sameUpdate.lastAccessed.time < 1000
    )
  }
}
