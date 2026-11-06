package expo.modules.updates.procedures

import android.content.Context
import android.net.Uri
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import expo.modules.manifests.core.ExpoUpdatesManifest
import expo.modules.updates.IUpdatesController
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.codesigning.CertificateFixtures
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.loader.UpdateResponse
import expo.modules.updates.loader.UpdateResponsePart
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.ExpoUpdatesUpdate
import expo.modules.updates.selectionpolicy.SelectionPolicyFactory
import expo.modules.updates.statemachine.UpdatesStateEvent
import expo.modules.updates.statemachine.UpdatesStateValue
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.CoroutineScope
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
class FetchUpdateProcedureTest {
  @get:Rule
  val temporaryFolder = TemporaryFolder()

  private val context: Context = ApplicationProvider.getApplicationContext()
  private val config = UpdatesConfiguration(
    null,
    mapOf<String, Any>(
      UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://u.expo.dev/00000000-0000-0000-0000-000000000000"),
      UpdatesConfiguration.UPDATES_CONFIGURATION_RUNTIME_VERSION_KEY to "1",
      UpdatesConfiguration.UPDATES_CONFIGURATION_HAS_EMBEDDED_UPDATE_KEY to false
    )
  )
  private val serverUpdate = ExpoUpdatesUpdate.fromExpoUpdatesManifest(
    ExpoUpdatesManifest(JSONObject(CertificateFixtures.testExpoUpdatesManifestBody)),
    null,
    config
  )
  private val olderUpdate = UpdateEntity(
    UUID.randomUUID(),
    Date(0),
    "1",
    serverUpdate.updateEntity!!.scopeKey,
    JSONObject("{}"),
    config.updateUrl,
    null
  )
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
  }

  @After
  fun teardown() {
    database.close()
  }

  @Test
  fun `compares with the update launched when the fetch runs`() = runTest {
    var launchedUpdate: UpdateEntity? = olderUpdate
    var result: IUpdatesController.FetchUpdateResult? = null
    val procedure = createProcedure({ launchedUpdate }, this) { result = it }

    launchedUpdate = serverUpdate.updateEntity
    procedure.run(procedureContext)

    Assert.assertTrue("Expected Failure, got: $result", result is IUpdatesController.FetchUpdateResult.Failure)
  }

  private fun createProcedure(
    getLaunchedUpdate: () -> UpdateEntity?,
    scope: CoroutineScope,
    callback: (IUpdatesController.FetchUpdateResult) -> Unit
  ): FetchUpdateProcedure {
    val fileDownloader: FileDownloader = mockk {
      coEvery { downloadRemoteUpdate(any()) } returns UpdateResponse(
        responseHeaderData = null,
        manifestUpdateResponsePart = UpdateResponsePart.ManifestUpdateResponsePart(serverUpdate),
        directiveUpdateResponsePart = null
      )
    }
    return FetchUpdateProcedure(
      context,
      config,
      UpdatesLogger(temporaryFolder.newFolder()),
      database,
      temporaryFolder.newFolder(),
      fileDownloader,
      SelectionPolicyFactory.createFilterAwarePolicy(config.getRuntimeVersion(), config),
      getLaunchedUpdate,
      scope,
      callback
    )
  }
}
