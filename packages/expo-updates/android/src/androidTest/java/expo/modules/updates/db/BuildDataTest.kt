package expo.modules.updates.db

import android.net.Uri
import androidx.room.Room
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.db.enums.UpdateStatus
import io.mockk.spyk
import io.mockk.verify
import org.junit.Assert.*

import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.util.*

@RunWith(AndroidJUnit4ClassRunner::class)
class BuildDataTest {
  private lateinit var db: UpdatesDatabase
  private val scopeKey = "test"
  private val buildMapDefault = mapOf(
    "scopeKey" to scopeKey,
    "updateUrl" to Uri.parse("https://exp.host/@test/test"),
    "requestHeaders" to mapOf("expo-channel-name" to "test")
  )
  private val buildMapTestChannel = mapOf(
    "scopeKey" to scopeKey,
    "updateUrl" to Uri.parse("https://exp.host/@test/test"),
    "requestHeaders" to mapOf("expo-channel-name" to "testTwo")
  )
  private val updatesConfigDefault = UpdatesConfiguration().loadValuesFromMap(
    buildMapDefault
  )
  private val updatesConfigTestChannel = UpdatesConfiguration().loadValuesFromMap(
    buildMapTestChannel
  )
  private lateinit var spyBuildData: BuildData

  @Before
  fun setUp() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    db = Room.inMemoryDatabaseBuilder(context, UpdatesDatabase::class.java).build()
    spyBuildData = spyk(BuildData)
  }

  @After
  fun tearDown() {
    db.close()
  }

  @Test
  fun ensureBuildDataIsConsistent_buildDataIsNull() {
    val nullBuildDataJSON = spyBuildData.getBuildDataFromDatabase(db, scopeKey)
    assertNull(nullBuildDataJSON)

    spyBuildData.ensureBuildDataIsConsistent(updatesConfigDefault, db)

    val buildDataJSON = spyBuildData.getBuildDataFromDatabase(db, scopeKey)
    assertNotNull(buildDataJSON)
    verify(exactly = 0) { spyBuildData.clearAllUpdatesFromDatabase(any()) }
    verify(exactly = 1) { spyBuildData.setBuildDataInDatabase(any(), any()) }
  }

  @Test
  fun ensureBuildDataIsConsistent_buildDataIsInconsistent() {
    spyBuildData.setBuildDataInDatabase(db, updatesConfigDefault)
    val buildDataJSONDefault = spyBuildData.getBuildDataFromDatabase(db, scopeKey)!!
    val isConsistentDefault = spyBuildData.isBuildDataConsistent(updatesConfigDefault, buildDataJSONDefault)
    val isConsistentTestChannel = spyBuildData.isBuildDataConsistent(updatesConfigTestChannel, buildDataJSONDefault)
    assertTrue(isConsistentDefault)
    assertFalse(isConsistentTestChannel)
    verify(exactly = 0) { spyBuildData.clearAllUpdatesFromDatabase(any()) }
    verify(exactly = 1) { spyBuildData.setBuildDataInDatabase(any(), any()) }

    spyBuildData.ensureBuildDataIsConsistent(updatesConfigTestChannel, db)

    val buildDataJSONTestChannel = spyBuildData.getBuildDataFromDatabase(db, scopeKey)!!
    val isConsistentDefaultAfter = spyBuildData.isBuildDataConsistent(updatesConfigDefault, buildDataJSONTestChannel)
    val isConsistentTestChannelAfter = spyBuildData.isBuildDataConsistent(updatesConfigTestChannel, buildDataJSONTestChannel)
    assertFalse(isConsistentDefaultAfter)
    assertTrue(isConsistentTestChannelAfter)
    verify(exactly = 1) { spyBuildData.clearAllUpdatesFromDatabase(any()) }
    verify(exactly = 2) { spyBuildData.setBuildDataInDatabase(any(), any()) }
  }

  @Test
  fun ensureBuildDataIsConsistent_buildDataIsConsistent() {
    spyBuildData.setBuildDataInDatabase(db, updatesConfigDefault)
    val buildDataJSONDefault = spyBuildData.getBuildDataFromDatabase(db, scopeKey)!!
    val isConsistentDefault = spyBuildData.isBuildDataConsistent(updatesConfigDefault, buildDataJSONDefault)
    val isConsistentTestChannel = spyBuildData.isBuildDataConsistent(updatesConfigTestChannel, buildDataJSONDefault)
    assertTrue(isConsistentDefault)
    assertFalse(isConsistentTestChannel)
    verify(exactly = 0) { spyBuildData.clearAllUpdatesFromDatabase(any()) }
    verify(exactly = 1) { spyBuildData.setBuildDataInDatabase(any(), any()) }

    spyBuildData.ensureBuildDataIsConsistent(updatesConfigDefault, db)

    val buildDataJSONTestChannel = spyBuildData.getBuildDataFromDatabase(db, scopeKey)!!
    val isConsistentDefaultAfter = spyBuildData.isBuildDataConsistent(updatesConfigDefault, buildDataJSONTestChannel)
    val isConsistentTestChannelAfter = spyBuildData.isBuildDataConsistent(updatesConfigTestChannel, buildDataJSONTestChannel)
    assertTrue(isConsistentDefaultAfter)
    assertFalse(isConsistentTestChannelAfter)
    verify(exactly = 0) { spyBuildData.clearAllUpdatesFromDatabase(any()) }
    verify(exactly = 1) { spyBuildData.setBuildDataInDatabase(any(), any()) }
  }

  @Test
  fun clearAllUpdatesFromDatabase() {
    val uuid = UUID.randomUUID()
    val date = Date()
    val runtimeVersion = "1.0"
    val projectId = "https://exp.host/@esamelson/test-project"
    val testUpdate = UpdateEntity(uuid, date, runtimeVersion, projectId)
    testUpdate.status = UpdateStatus.READY

    db.updateDao().insertUpdate(testUpdate)
    val byId = db.updateDao().loadUpdateWithId(uuid)
    assertNotNull(byId)

    BuildData.clearAllUpdatesFromDatabase(db)

    val shouldBeNull = db.updateDao().loadUpdateWithId(uuid)
    assertNull(shouldBeNull)
  }
}
