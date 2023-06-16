package expo.modules.updates

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.updates.statemachine.UpdatesStateChangeEventSender
import expo.modules.updates.statemachine.UpdatesStateEvent
import expo.modules.updates.statemachine.UpdatesStateEventType
import expo.modules.updates.statemachine.UpdatesStateMachine
import expo.modules.updates.statemachine.UpdatesStateValue
import org.json.JSONObject
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4ClassRunner::class)
class UpdatesStateMachineInstrumentationTest {
  private val androidContext = InstrumentationRegistry.getInstrumentation().context
  // Test classes
  class TestStateChangeEventSender : UpdatesStateChangeEventSender {
    var lastEventType: UpdatesStateEventType? = null

    override fun sendUpdateStateChangeEventToBridge(
      eventType: UpdatesStateEventType,
      context: Map<String, Any>
    ) {
      lastEventType = eventType
    }
  }

  @Test
  fun test_defaultState() {
    val testStateChangeEventSender = TestStateChangeEventSender()
    val machine = UpdatesStateMachine(androidContext, testStateChangeEventSender)
    Assert.assertEquals(UpdatesStateValue.Idle, machine.state)
  }

  @Test
  fun test_handleCheckAndCheckCompleteAvailable() {
    val testStateChangeEventSender = TestStateChangeEventSender()
    val machine = UpdatesStateMachine(androidContext, testStateChangeEventSender)

    machine.processEvent(UpdatesStateEvent(UpdatesStateEventType.Check))

    Assert.assertEquals(UpdatesStateValue.Checking, machine.state)
    Assert.assertEquals(UpdatesStateEventType.Check, testStateChangeEventSender.lastEventType)

    machine.processEvent(
      UpdatesStateEvent(
        UpdatesStateEventType.CheckCompleteAvailable,
        mapOf(
          "manifest" to JSONObject("{\"updateId\":\"0000-xxxx\"}")
        )
      )
    )
    Assert.assertEquals(UpdatesStateValue.Idle, machine.state)
    Assert.assertFalse(machine.context.isChecking)
    Assert.assertTrue(machine.context.isUpdateAvailable)
    Assert.assertFalse(machine.context.isUpdatePending)
    Assert.assertEquals("0000-xxxx", machine.context.latestManifest?.get("updateId"))
    Assert.assertEquals(UpdatesStateEventType.CheckCompleteAvailable, testStateChangeEventSender.lastEventType)
  }

  @Test
  fun test_handleCheckCompleteUnavailable() {
    val testStateChangeEventSender = TestStateChangeEventSender()
    val machine = UpdatesStateMachine(androidContext, testStateChangeEventSender)

    machine.processEvent(UpdatesStateEvent(UpdatesStateEventType.Check))

    Assert.assertEquals(UpdatesStateValue.Checking, machine.state)
    Assert.assertEquals(UpdatesStateEventType.Check, testStateChangeEventSender.lastEventType)

    machine.processEvent(UpdatesStateEvent(UpdatesStateEventType.CheckCompleteUnavailable))

    Assert.assertEquals(UpdatesStateValue.Idle, machine.state)
    Assert.assertFalse(machine.context.isChecking)
    Assert.assertFalse(machine.context.isUpdateAvailable)
    Assert.assertFalse(machine.context.isUpdatePending)
    Assert.assertNull(machine.context.latestManifest)
    Assert.assertEquals(UpdatesStateEventType.CheckCompleteUnavailable, testStateChangeEventSender.lastEventType)
  }

  @Test
  fun test_handleDownloadAndDownloadComplete() {
    val testStateChangeEventSender = TestStateChangeEventSender()
    val machine = UpdatesStateMachine(androidContext, testStateChangeEventSender)

    machine.processEvent(UpdatesStateEvent(UpdatesStateEventType.Download))

    Assert.assertEquals(UpdatesStateValue.Downloading, machine.state)
    Assert.assertEquals(UpdatesStateEventType.Download, testStateChangeEventSender.lastEventType)

    machine.processEvent(
      UpdatesStateEvent(
        UpdatesStateEventType.DownloadComplete,
        mapOf(
          "manifest" to JSONObject("{\"updateId\":\"0000-xxxx\"}")
        )
      )
    )
    Assert.assertEquals(UpdatesStateValue.Idle, machine.state)
    Assert.assertFalse(machine.context.isDownloading)
    Assert.assertNull(machine.context.downloadError)
    Assert.assertEquals("0000-xxxx", machine.context.latestManifest?.get("updateId"))
    Assert.assertEquals("0000-xxxx", machine.context.downloadedManifest?.get("updateId"))
    Assert.assertTrue(machine.context.isUpdateAvailable)
    Assert.assertTrue(machine.context.isUpdatePending)
    Assert.assertEquals(UpdatesStateEventType.DownloadComplete, testStateChangeEventSender.lastEventType)
  }

  @Test
  fun test_handleRollback() {
    val testStateChangeEventSender = TestStateChangeEventSender()
    val machine = UpdatesStateMachine(androidContext, testStateChangeEventSender)

    machine.processEvent(UpdatesStateEvent(UpdatesStateEventType.Check))

    Assert.assertEquals(UpdatesStateValue.Checking, machine.state)
    Assert.assertEquals(UpdatesStateEventType.Check, testStateChangeEventSender.lastEventType)

    machine.processEvent(
      UpdatesStateEvent(
        UpdatesStateEventType.CheckCompleteAvailable,
        mapOf(
          "isRollBackToEmbedded" to true
        )
      )
    )
    Assert.assertEquals(UpdatesStateValue.Idle, machine.state)
    Assert.assertFalse(machine.context.isChecking)
    Assert.assertNull(machine.context.checkError)
    Assert.assertTrue(machine.context.isUpdateAvailable)
    Assert.assertFalse(machine.context.isUpdatePending)
    Assert.assertTrue(machine.context.isRollback)
  }

  @Test
  fun test_checkError() {
    val testStateChangeEventSender = TestStateChangeEventSender()
    val machine = UpdatesStateMachine(androidContext, testStateChangeEventSender)

    machine.processEvent(UpdatesStateEvent(UpdatesStateEventType.Check))

    Assert.assertEquals(UpdatesStateValue.Checking, machine.state)
    Assert.assertEquals(UpdatesStateEventType.Check, testStateChangeEventSender.lastEventType)

    machine.processEvent(
      UpdatesStateEvent(
        UpdatesStateEventType.CheckError,
        mapOf(
          "message" to "A serious error has occurred"
        )
      )
    )
    Assert.assertEquals(UpdatesStateValue.Idle, machine.state)
    Assert.assertFalse(machine.context.isChecking)
    Assert.assertNotNull(machine.context.checkError)
    Assert.assertFalse(machine.context.isUpdateAvailable)
    Assert.assertFalse(machine.context.isUpdatePending)
    Assert.assertFalse(machine.context.isRollback)
  }

  @Test
  fun test_invalidTransitions() {
    val testStateChangeEventSender = TestStateChangeEventSender()
    val machine = UpdatesStateMachine(androidContext, testStateChangeEventSender)
    machine.processEvent(UpdatesStateEvent(UpdatesStateEventType.Check))
    Assert.assertEquals(UpdatesStateValue.Checking, machine.state)
    // Test invalid transitions and ensure that state does not change
    machine.processEvent(UpdatesStateEvent(UpdatesStateEventType.Download))
    Assert.assertEquals(UpdatesStateValue.Checking, machine.state)
    machine.processEvent(UpdatesStateEvent(UpdatesStateEventType.DownloadComplete))
    Assert.assertEquals(UpdatesStateValue.Checking, machine.state)
  }
}
