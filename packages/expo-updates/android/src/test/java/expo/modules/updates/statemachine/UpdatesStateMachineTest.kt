package expo.modules.updates.statemachine

import expo.modules.updates.events.IUpdatesEventManager
import expo.modules.updates.events.IUpdatesEventManagerObserver
import expo.modules.updates.logging.UpdatesLogReader
import expo.modules.updates.logging.UpdatesLogger
import org.junit.Assert
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File
import java.lang.ref.WeakReference
import java.lang.reflect.Field
import java.lang.reflect.InvocationTargetException
import java.lang.reflect.Method
import java.util.Date

@RunWith(RobolectricTestRunner::class)
class UpdatesStateMachineTest {
  @get:Rule
  val temporaryFolder = TemporaryFolder()

  private class TestStateChangeEventManager : IUpdatesEventManager {
    override var observer: WeakReference<IUpdatesEventManagerObserver>? = null
    override fun sendStateMachineContextEvent(context: UpdatesStateContext) = Unit
  }

  private fun UpdatesStateMachine.processEventTest(event: UpdatesStateEvent) {
    val method: Method =
      UpdatesStateMachine::class.java.getDeclaredMethod("processEvent", UpdatesStateEvent::class.java)
    method.isAccessible = true
    try {
      method.invoke(this, event)
    } catch (e: InvocationTargetException) {
      throw e.targetException
    }
  }

  private fun UpdatesStateMachine.getState(): UpdatesStateValue {
    val field: Field = UpdatesStateMachine::class.java.getDeclaredField("state")
    field.isAccessible = true
    return field.get(this) as UpdatesStateValue
  }

  private fun createMachine(filesDirectory: File) = UpdatesStateMachine(
    UpdatesLogger(filesDirectory),
    TestStateChangeEventManager(),
    UpdatesStateValue.entries.toSet()
  )

  @Test
  fun `an event that is not allowed from the current state is dropped and logged`() {
    val filesDirectory = temporaryFolder.newFolder()
    val now = Date()
    val machine = createMachine(filesDirectory)

    // DownloadError is only allowed while downloading. From Idle it must be rejected without
    // throwing, so that a startup failure cannot take down the app.
    machine.processEventTest(UpdatesStateEvent.DownloadError("boom"))

    Assert.assertEquals(UpdatesStateValue.Idle, machine.getState())
    Assert.assertNull(machine.context.downloadError)

    // The persistent file log handler writes asynchronously.
    Thread.sleep(500)
    val logs = UpdatesLogReader(filesDirectory).getLogEntries(Date(now.time - 5000))
    Assert.assertTrue(
      "Expected a warning about the dropped event, got: $logs",
      logs.any { it.contains("invalid transition requested, event dropped") }
    )
  }

  @Test
  fun `entering the downloading state first lets a download error reach the context`() {
    val filesDirectory = temporaryFolder.newFolder()
    val machine = createMachine(filesDirectory)

    // This is the sequence both StartupProcedure implementations use when a background update
    // fails while the machine is idle.
    machine.processEventTest(UpdatesStateEvent.Download())
    machine.processEventTest(UpdatesStateEvent.DownloadError("Failed to download remote update: HTTP 502"))

    Assert.assertEquals(UpdatesStateValue.Idle, machine.getState())
    Assert.assertEquals(
      "Failed to download remote update: HTTP 502",
      machine.context.downloadError?.message
    )
  }
}
