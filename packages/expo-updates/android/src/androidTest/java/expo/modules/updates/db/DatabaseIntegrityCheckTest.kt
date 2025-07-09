package expo.modules.updates.db

import android.content.Context
import androidx.room.Room
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.db.enums.UpdateStatus
import expo.modules.updates.db.entity.AssetEntity
import io.mockk.every
import io.mockk.spyk
import org.json.JSONObject
import org.junit.After
import org.junit.Assert
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.util.*

@RunWith(AndroidJUnit4ClassRunner::class)
class DatabaseIntegrityCheckTest {
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
  fun testFilterEmbeddedUpdates() {
    // We can't run any updates with the status EMBEDDED if they aren't the update that's
    // currently embedded in the installed app; the integrity check should remove any such updates
    // from the database entirely.
    val scopeKey = "testScopeKey"

    val embeddedUpdate1 = UpdateEntity(UUID.randomUUID(), Date(1608667857774L), "1.0", scopeKey, JSONObject("{}"))
    embeddedUpdate1.status = UpdateStatus.EMBEDDED

    val embeddedUpdate2 = UpdateEntity(UUID.randomUUID(), Date(1608667857775L), "1.0", scopeKey, JSONObject("{}"))
    embeddedUpdate2.status = UpdateStatus.EMBEDDED

    db.updateDao().insertUpdate(embeddedUpdate1)
    db.updateDao().insertUpdate(embeddedUpdate2)

    Assert.assertEquals(2, db.updateDao().loadAllUpdates().size.toLong())

    DatabaseIntegrityCheck().run(db, null, embeddedUpdate2)

    val allUpdates = db.updateDao().loadAllUpdates()
    Assert.assertEquals(1, allUpdates.size.toLong())
    Assert.assertEquals(embeddedUpdate2.id, allUpdates[0].id)

    // cleanup
    db.updateDao().deleteUpdates(allUpdates)
  }

  @Test
  fun testMissingAssets() {
    val asset1 = AssetEntity("asset1", "png")
    asset1.relativePath = "asset1.png"

    val scopeKey = "testScopeKey"

    val update1 = UpdateEntity(UUID.randomUUID(), Date(), "1.0", scopeKey, JSONObject("{}"))
    update1.status = UpdateStatus.READY

    db.updateDao().insertUpdate(update1)
    db.assetDao().insertAssets(listOf(asset1), update1)

    Assert.assertEquals(1, db.updateDao().loadAllUpdates().size.toLong())
    Assert.assertEquals(1, db.assetDao().loadAllAssets().size.toLong())

    val integrityCheck = spyk(DatabaseIntegrityCheck())
    every { integrityCheck.assetExists(any(), any()) } returns false
    integrityCheck.run(db, context.cacheDir, update1)

    val allUpdates = db.updateDao().loadAllUpdates()
    val allAssets = db.assetDao().loadAllAssets()
    Assert.assertEquals(1, allUpdates.size.toLong())
    Assert.assertEquals(UpdateStatus.PENDING, allUpdates[0].status)
    Assert.assertEquals(1, allAssets.size.toLong())

    // cleanup
    db.updateDao().deleteUpdates(allUpdates)
  }

  @Test
  fun testNoMissingAssets() {
    val asset1 = AssetEntity("asset1", "png")
    asset1.relativePath = "asset1.png"

    val scopeKey = "testScopeKey"

    val update1 = UpdateEntity(UUID.randomUUID(), Date(), "1.0", scopeKey, JSONObject("{}"))
    update1.status = UpdateStatus.READY

    db.updateDao().insertUpdate(update1)
    db.assetDao().insertAssets(listOf(asset1), update1)

    Assert.assertEquals(1, db.updateDao().loadAllUpdates().size.toLong())
    Assert.assertEquals(1, db.assetDao().loadAllAssets().size.toLong())

    val integrityCheck = spyk(DatabaseIntegrityCheck())
    every { integrityCheck.assetExists(any(), any()) } returns true
    integrityCheck.run(db, context.cacheDir, update1)

    val allUpdates = db.updateDao().loadAllUpdates()
    val allAssets = db.assetDao().loadAllAssets()
    Assert.assertEquals(1, allUpdates.size.toLong())
    Assert.assertEquals(UpdateStatus.READY, allUpdates[0].status)
    Assert.assertEquals(1, allAssets.size.toLong())

    // cleanup
    db.updateDao().deleteUpdates(allUpdates)
  }
}
