package expo.modules.updates.procedures

import android.content.Context
import android.net.Uri
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import expo.modules.updates.IUpdatesController
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.manifests.core.ExpoUpdatesManifest
import expo.modules.updates.codesigning.CertificateFixtures
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.loader.UpdateResponse
import expo.modules.updates.loader.UpdateResponsePart
import expo.modules.updates.logging.UpdatesLogEntry
import expo.modules.updates.logging.UpdatesLogReader
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.ExpoUpdatesUpdate
import expo.modules.updates.selectionpolicy.SelectionPolicyFactory
import expo.modules.updates.statemachine.UpdatesStateEvent
import expo.modules.updates.statemachine.UpdatesStateValue
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.json.JSONObject
import org.junit.Assert
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import java.util.Date

@RunWith(RobolectricTestRunner::class)
class ProcedureErrorLoggingTest {
  @get:Rule
  val temporaryFolder = TemporaryFolder()

  private val context: Context = ApplicationProvider.getApplicationContext()
  private lateinit var database: UpdatesDatabase
  private lateinit var logsDirectory: File
  private lateinit var logger: UpdatesLogger
  private val startTime = Date()

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
    logsDirectory = temporaryFolder.newFolder()
    logger = UpdatesLogger(logsDirectory)
  }

  @After
  fun teardown() {
    database.close()
  }

  @Test
  fun `a failed check for update logs one error with the HTTP status`() = runTest {
    val config = createUpdatesConfiguration()
    var result: IUpdatesController.CheckForUpdateResult? = null
    val procedure = CheckForUpdateProcedure(
      context,
      config,
      database,
      logger,
      createFileDownloaderFailingWithHttp500(),
      SelectionPolicyFactory.createFilterAwarePolicy(config.getRuntimeVersion(), config),
      null
    ) { result = it }

    procedure.run(procedureContext)

    Assert.assertTrue(result is IUpdatesController.CheckForUpdateResult.ErrorResult)
    assertOneErrorEntry("UpdateFailedToLoad", "HTTP 500: server exploded")
  }

  @Test
  fun `a check that cannot reach the server logs UpdateServerUnreachable`() = runTest {
    val config = createUpdatesConfiguration()
    val procedure = CheckForUpdateProcedure(
      context,
      config,
      database,
      logger,
      createFileDownloaderFailingWith(
        IOException("Failed to download remote update", UnknownHostException("Unable to resolve host \"u.expo.dev\""))
      ),
      SelectionPolicyFactory.createFilterAwarePolicy(config.getRuntimeVersion(), config),
      null
    ) {}

    procedure.run(procedureContext)

    assertOneErrorEntry("UpdateServerUnreachable", "Unable to resolve host")
  }

  @Test
  fun `a failed fetch logs one error with the HTTP status`() = runTest {
    val config = createUpdatesConfiguration()
    var result: IUpdatesController.FetchUpdateResult? = null
    val procedure = FetchUpdateProcedure(
      context,
      config,
      logger,
      database,
      temporaryFolder.newFolder(),
      createFileDownloaderFailingWithHttp500(),
      SelectionPolicyFactory.createFilterAwarePolicy(config.getRuntimeVersion(), config),
      null,
      this
    ) { result = it }

    procedure.run(procedureContext)

    Assert.assertTrue(result is IUpdatesController.FetchUpdateResult.ErrorResult)
    assertOneErrorEntry("UpdateFailedToLoad", "HTTP 500: server exploded")
  }

  @Test
  fun `a fetch that times out logs UpdateServerUnreachable`() = runTest {
    val config = createUpdatesConfiguration()
    val procedure = FetchUpdateProcedure(
      context,
      config,
      logger,
      database,
      temporaryFolder.newFolder(),
      createFileDownloaderFailingWith(IOException("Failed to download remote update", SocketTimeoutException("timeout"))),
      SelectionPolicyFactory.createFilterAwarePolicy(config.getRuntimeVersion(), config),
      null,
      this
    ) {}

    procedure.run(procedureContext)

    assertOneErrorEntry("UpdateServerUnreachable", "timeout")
  }

  @Test
  fun `a fetch with failed asset downloads logs one AssetsFailedToLoad error`() = runTest {
    val config = createUpdatesConfiguration(runtimeVersion = "1")
    val procedure = FetchUpdateProcedure(
      context,
      config,
      logger,
      database,
      temporaryFolder.newFolder(),
      createFileDownloaderWithFailingAssets { notFound() },
      SelectionPolicyFactory.createFilterAwarePolicy(config.getRuntimeVersion(), config),
      null,
      this
    ) {}

    procedure.run(procedureContext)

    assertOneErrorEntry("AssetsFailedToLoad", "Failed to load 2 assets")
    assertOneErrorEntry("AssetsFailedToLoad", "HTTP response error 404")
  }

  @Test
  fun `a fetch whose asset downloads time out logs UpdateServerUnreachable`() = runTest {
    val config = createUpdatesConfiguration(runtimeVersion = "1")
    val procedure = FetchUpdateProcedure(
      context,
      config,
      logger,
      database,
      temporaryFolder.newFolder(),
      createFileDownloaderWithFailingAssets { timeout() },
      SelectionPolicyFactory.createFilterAwarePolicy(config.getRuntimeVersion(), config),
      null,
      this
    ) {}

    procedure.run(procedureContext)

    assertOneErrorEntry("UpdateServerUnreachable", "Failed to load 2 assets")
  }

  @Test
  fun `a fetch with different asset failures logs one error for each kind of failure`() = runTest {
    val config = createUpdatesConfiguration(runtimeVersion = "1")
    val procedure = FetchUpdateProcedure(
      context,
      config,
      logger,
      database,
      temporaryFolder.newFolder(),
      createFileDownloaderWithFailingAssets { asset ->
        if (asset.isLaunchAsset) {
          timeout()
        } else {
          notFound()
        }
      },
      SelectionPolicyFactory.createFilterAwarePolicy(config.getRuntimeVersion(), config),
      null,
      this
    ) {}

    procedure.run(procedureContext)

    val errors = readErrorEntries()
    Assert.assertEquals("Expected two error entries, got: $errors", 2, errors.size)
    val unreachable = errors.single { it.code == "UpdateServerUnreachable" }
    Assert.assertTrue(unreachable.message, unreachable.message.contains("Failed to load 1 asset ") && unreachable.message.contains("timeout"))
    val notFound = errors.single { it.code == "AssetsFailedToLoad" }
    Assert.assertTrue(notFound.message, notFound.message.contains("Failed to load 1 asset ") && notFound.message.contains("HTTP response error 404"))
  }

  private fun assertOneErrorEntry(code: String, text: String) {
    val errors = readErrorEntries()
    Assert.assertEquals("Expected one error entry, got: $errors", 1, errors.size)
    val error = errors.single()
    Assert.assertEquals(code, error.code)
    Assert.assertTrue("Expected \"$text\" in: ${error.message}", error.message.contains(text))
  }

  private fun readErrorEntries(): List<UpdatesLogEntry> {
    // The persistent file log handler writes asynchronously.
    Thread.sleep(500)
    return UpdatesLogReader(logsDirectory)
      .getLogEntries(Date(startTime.time - 5000))
      .mapNotNull { UpdatesLogEntry.create(it) }
      .filter { it.level == "error" }
  }

  private fun notFound(): Exception =
    IOException("Failed to download asset", FileDownloader.AssetHttpResponseException(404, "asset not found"))

  private fun timeout(): Exception =
    IOException("Failed to download asset", SocketTimeoutException("timeout"))

  private fun createFileDownloaderFailingWithHttp500(): FileDownloader =
    createFileDownloaderFailingWith(
      IOException(
        "Failed to download remote update",
        IOException("Remote update request not successful", IOException("HTTP 500: server exploded"))
      )
    )

  private fun createFileDownloaderFailingWith(error: Exception): FileDownloader {
    return mockk {
      coEvery { downloadRemoteUpdate(any()) } throws error
    }
  }

  private fun createFileDownloaderWithFailingAssets(errorFor: (AssetEntity) -> Exception): FileDownloader {
    val config = createUpdatesConfiguration(runtimeVersion = "1")
    val update = ExpoUpdatesUpdate.fromExpoUpdatesManifest(
      ExpoUpdatesManifest(JSONObject(CertificateFixtures.testExpoUpdatesManifestBody)),
      null,
      config
    )
    return mockk {
      coEvery { downloadRemoteUpdate(any()) } returns UpdateResponse(
        responseHeaderData = null,
        manifestUpdateResponsePart = UpdateResponsePart.ManifestUpdateResponsePart(update),
        directiveUpdateResponsePart = null
      )
      coEvery { downloadAsset(any(), any(), any(), any(), any(), any(), any()) } answers { throw errorFor(firstArg()) }
    }
  }

  private fun createUpdatesConfiguration(runtimeVersion: String = "1.0"): UpdatesConfiguration {
    val configMap = mapOf<String, Any>(
      UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://u.expo.dev/00000000-0000-0000-0000-000000000000"),
      UpdatesConfiguration.UPDATES_CONFIGURATION_RUNTIME_VERSION_KEY to runtimeVersion,
      UpdatesConfiguration.UPDATES_CONFIGURATION_HAS_EMBEDDED_UPDATE_KEY to false
    )
    return UpdatesConfiguration(null, configMap)
  }
}
