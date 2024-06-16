package expo.modules.updates.db

import android.net.Uri
import androidx.room.Room
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.entity.UpdateEntity
import io.mockk.spyk
import io.mockk.verify
import org.json.JSONObject
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
  private val buildMapTestChannel = mapOf(
    "scopeKey" to scopeKey,
    "updateUrl" to Uri.parse("https://exp.host/@test/test"),
    "requestHeaders" to mapOf("expo-channel-name" to "test")
  )
  private val buildMapTestTwoChannel = mapOf(
    "scopeKey" to scopeKey,
    "updateUrl" to Uri.parse("https://exp.host/@test/test"),
    "requestHeaders" to mapOf("expo-channel-name" to "testTwo")
  )
  private val updatesConfigTestChannel = UpdatesConfiguration(null, buildMapTestChannel)
  private val updatesConfigTestTwoChannel = UpdatesConfiguration(null, buildMapTestTwoChannel)

  private val uuid: UUID = UUID.randomUUID()
  private lateinit var spyBuildData: BuildData

  @Before
  fun setUp() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    db = Room.inMemoryDatabaseBuilder(context, UpdatesDatabase::class.java).build()

    val date = Date()
    val runtimeVersion = "1.0"
    val projectId = "https://exp.host/@esamelson/test-project"
    val testUpdate = UpdateEntity(uuid, date, runtimeVersion, projectId, JSONObject("{}"))
    db.updateDao().insertUpdate(testUpdate)

    spyBuildData = spyk(BuildData)
  }

  @After
  fun tearDown() {
    db.close()
  }

  @Test
  fun clearAllUpdatesFromDatabase() {
    val shouldNotBeNull = db.updateDao().loadUpdateWithId(uuid)
    assertNotNull(shouldNotBeNull)

    BuildData.clearAllUpdatesFromDatabase(db)

    val allUpdates = db.updateDao().loadAllUpdates()
    assertEquals(0, allUpdates.size)
  }

  @Test
  fun ensureBuildDataIsConsistent_buildDataIsNull() {
    val nullBuildDataJSON = spyBuildData.getBuildDataFromDatabase(db, scopeKey)
    assertNull(nullBuildDataJSON)

    spyBuildData.ensureBuildDataIsConsistent(updatesConfigTestChannel, db)

    val buildDataJSON = spyBuildData.getBuildDataFromDatabase(db, scopeKey)
    assertNotNull(buildDataJSON)
    verify(exactly = 0) { spyBuildData.clearAllUpdatesFromDatabase(any()) }
    verify(exactly = 1) { spyBuildData.setBuildDataInDatabase(any(), any()) }
  }

  @Test
  fun ensureBuildDataIsConsistent_buildDataIsInconsistent_channel() {
    spyBuildData.setBuildDataInDatabase(db, updatesConfigTestChannel)
    val buildDataJSONDefault = spyBuildData.getBuildDataFromDatabase(db, scopeKey)!!
    val isConsistentDefault = spyBuildData.isBuildDataConsistent(updatesConfigTestChannel, buildDataJSONDefault)
    val isConsistentTestChannel = spyBuildData.isBuildDataConsistent(updatesConfigTestTwoChannel, buildDataJSONDefault)
    assertTrue(isConsistentDefault)
    assertFalse(isConsistentTestChannel)
    verify(exactly = 0) { spyBuildData.clearAllUpdatesFromDatabase(any()) }
    verify(exactly = 1) { spyBuildData.setBuildDataInDatabase(any(), any()) }

    spyBuildData.ensureBuildDataIsConsistent(updatesConfigTestTwoChannel, db)

    val buildDataJSONTestChannel = spyBuildData.getBuildDataFromDatabase(db, scopeKey)!!
    val isConsistentDefaultAfter = spyBuildData.isBuildDataConsistent(updatesConfigTestChannel, buildDataJSONTestChannel)
    val isConsistentTestChannelAfter = spyBuildData.isBuildDataConsistent(updatesConfigTestTwoChannel, buildDataJSONTestChannel)
    assertFalse(isConsistentDefaultAfter)
    assertTrue(isConsistentTestChannelAfter)
    verify(exactly = 1) { spyBuildData.clearAllUpdatesFromDatabase(any()) }
    verify(exactly = 2) { spyBuildData.setBuildDataInDatabase(any(), any()) }

    val allUpdates = db.updateDao().loadAllUpdates()
    assertEquals(0, allUpdates.size)
  }

  @Test
  fun ensureBuildDataIsConsistent_buildDataIsConsistent_channel() {
    spyBuildData.setBuildDataInDatabase(db, updatesConfigTestChannel)
    val buildDataJSONTest = spyBuildData.getBuildDataFromDatabase(db, scopeKey)!!
    val isConsistentTest = spyBuildData.isBuildDataConsistent(updatesConfigTestChannel, buildDataJSONTest)
    val isConsistentTestTwo = spyBuildData.isBuildDataConsistent(updatesConfigTestTwoChannel, buildDataJSONTest)
    assertTrue(isConsistentTest)
    assertFalse(isConsistentTestTwo)
    verify(exactly = 0) { spyBuildData.clearAllUpdatesFromDatabase(any()) }
    verify(exactly = 1) { spyBuildData.setBuildDataInDatabase(any(), any()) }

    spyBuildData.ensureBuildDataIsConsistent(updatesConfigTestChannel, db)

    val buildDataJSONTestAfter = spyBuildData.getBuildDataFromDatabase(db, scopeKey)!!
    val isConsistentTestAfter = spyBuildData.isBuildDataConsistent(updatesConfigTestChannel, buildDataJSONTestAfter)
    val isConsistentTestTwoAfter = spyBuildData.isBuildDataConsistent(updatesConfigTestTwoChannel, buildDataJSONTestAfter)
    assertTrue(isConsistentTestAfter)
    assertFalse(isConsistentTestTwoAfter)
    verify(exactly = 0) { spyBuildData.clearAllUpdatesFromDatabase(any()) }
    verify(exactly = 1) { spyBuildData.setBuildDataInDatabase(any(), any()) }

    val allUpdates = db.updateDao().loadAllUpdates()
    assertEquals(1, allUpdates.size)
  }
}
