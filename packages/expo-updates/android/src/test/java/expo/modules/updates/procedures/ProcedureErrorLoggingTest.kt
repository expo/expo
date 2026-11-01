package expo.modules.updates.procedures

import android.content.Context
import android.net.Uri
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import expo.modules.updates.IUpdatesController
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.logging.UpdatesLogEntry
import expo.modules.updates.logging.UpdatesLogReader
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.selectionpolicy.SelectionPolicyFactory
import expo.modules.updates.statemachine.UpdatesStateEvent
import expo.modules.updates.statemachine.UpdatesStateValue
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.After
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

  private fun assertOneErrorEntry(code: String, text: String) {
    // The persistent file log handler writes asynchronously.
    Thread.sleep(500)
    val errors = UpdatesLogReader(logsDirectory)
      .getLogEntries(Date(startTime.time - 5000))
      .mapNotNull { UpdatesLogEntry.create(it) }
      .filter { it.level == "error" }
    Assert.assertEquals("Expected one error entry, got: $errors", 1, errors.size)
    val error = errors.single()
    Assert.assertEquals(code, error.code)
    Assert.assertTrue("Expected \"$text\" in: ${error.message}", error.message.contains(text))
  }

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

  private fun createUpdatesConfiguration(): UpdatesConfiguration {
    val configMap = mapOf<String, Any>(
      UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://u.expo.dev/00000000-0000-0000-0000-000000000000"),
      UpdatesConfiguration.UPDATES_CONFIGURATION_RUNTIME_VERSION_KEY to "1.0",
      UpdatesConfiguration.UPDATES_CONFIGURATION_HAS_EMBEDDED_UPDATE_KEY to false
    )
    return UpdatesConfiguration(null, configMap)
  }
}
