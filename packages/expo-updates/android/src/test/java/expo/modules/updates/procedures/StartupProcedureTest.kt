package expo.modules.updates.procedures

import android.content.Context
import android.net.Uri
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesConfiguration.CheckAutomaticallyConfiguration
import expo.modules.updates.db.BuildData
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.launcher.Launcher
import expo.modules.updates.loader.LoaderTask
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.statemachine.UpdatesStateEvent
import expo.modules.updates.statemachine.UpdatesStateValue
import io.mockk.coJustRun
import io.mockk.mockk
import io.mockk.mockkConstructor
import io.mockk.unmockkAll
import kotlinx.coroutines.test.runTest
import org.json.JSONObject
import org.junit.After
import org.junit.Assert
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.util.Date
import java.util.UUID

@RunWith(RobolectricTestRunner::class)
class StartupProcedureTest {
  @get:Rule
  val temporaryFolder = TemporaryFolder()

  private val context: Context = ApplicationProvider.getApplicationContext()
  private lateinit var database: UpdatesDatabase

  private val procedureContext = object : StateMachineProcedure.ProcedureContext {
    override fun processStateEvent(event: UpdatesStateEvent) {}

    @Deprecated("Avoid needing to access current state to know how to transition to next state")
    override fun getCurrentState() = UpdatesStateValue.Idle
    override fun resetStateAfterRestart() {}
    override fun onComplete() {}
  }

  @Before
  fun setup() {
    database = Room.inMemoryDatabaseBuilder(context, UpdatesDatabase::class.java)
      .allowMainThreadQueries()
      .build()
    // Stop the procedure after the startup bookkeeping, before any loading work.
    mockkConstructor(LoaderTask::class)
    coJustRun { anyConstructed<LoaderTask>().start() }
  }

  @After
  fun teardown() {
    database.close()
    unmockkAll()
  }

  @Test
  fun `run clears updates when stored build data is inconsistent`() = runTest {
    val config = createUpdatesConfiguration(channel = "default")
    database.updateDao().insertUpdate(testUpdate(config.scopeKey))
    BuildData.setBuildDataInDatabase(database, createUpdatesConfiguration(channel = "preview"))

    runStartupProcedure(config)

    Assert.assertTrue(database.updateDao().loadAllUpdates().isEmpty())
    val storedBuildData = BuildData.getBuildDataFromDatabase(database, config.scopeKey)!!
    Assert.assertTrue(BuildData.isBuildDataConsistent(config, storedBuildData))
  }

  @Test
  fun `run keeps updates when stored build data is consistent`() = runTest {
    val config = createUpdatesConfiguration(channel = "default")
    database.updateDao().insertUpdate(testUpdate(config.scopeKey))
    BuildData.setBuildDataInDatabase(database, config)

    runStartupProcedure(config)

    Assert.assertEquals(1, database.updateDao().loadAllUpdates().size)
  }

  @Test
  fun `run skips the build data check when an updates override is set`() = runTest {
    val config = createUpdatesConfiguration(channel = "default", hasUpdatesOverride = true)
    database.updateDao().insertUpdate(testUpdate(config.scopeKey))
    BuildData.setBuildDataInDatabase(database, createUpdatesConfiguration(channel = "preview"))

    runStartupProcedure(config)

    Assert.assertEquals(1, database.updateDao().loadAllUpdates().size)
  }

  private suspend fun runStartupProcedure(config: UpdatesConfiguration) {
    val procedure = StartupProcedure(
      context,
      config,
      DatabaseHolder(database),
      temporaryFolder.newFolder(".expo-internal"),
      mockk(relaxed = true),
      mockk(relaxed = true),
      UpdatesLogger(context.filesDir),
      object : StartupProcedure.StartupProcedureCallback {
        override fun onFinished() {}
        override fun onRequestRelaunch(shouldRunReaper: Boolean, callback: Launcher.LauncherCallback) {}
      }
    )
    procedure.run(procedureContext)
  }

  private fun testUpdate(scopeKey: String) = UpdateEntity(
    UUID.randomUUID(),
    Date(),
    "1.0.0",
    scopeKey,
    JSONObject(),
    null,
    null
  )

  private fun createUpdatesConfiguration(
    channel: String,
    hasUpdatesOverride: Boolean = false
  ): UpdatesConfiguration {
    val requestHeaders = mapOf("expo-channel-name" to channel)
    return UpdatesConfiguration(
      scopeKey = "test-scope",
      updateUrl = Uri.parse("https://example.com"),
      originalEmbeddedUpdateUrl = Uri.parse("https://example.com"),
      runtimeVersionRaw = "1.0.0",
      launchWaitMs = 0,
      checkOnLaunch = CheckAutomaticallyConfiguration.ALWAYS,
      hasEmbeddedUpdate = true,
      originalHasEmbeddedUpdate = true,
      requestHeaders = requestHeaders,
      originalEmbeddedRequestHeaders = requestHeaders,
      codeSigningCertificate = null,
      codeSigningMetadata = emptyMap(),
      codeSigningIncludeManifestResponseCertificateChain = false,
      codeSigningAllowUnsignedManifests = false,
      enableExpoUpdatesProtocolV0CompatibilityMode = false,
      disableAntiBrickingMeasures = false,
      enableBsdiffPatchSupport = false,
      hasUpdatesOverride = hasUpdatesOverride,
      cachedOverrideMap = emptyMap()
    )
  }
}
