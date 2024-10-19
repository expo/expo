package expo.modules.updates

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.kotlin.events.EventEmitter
import expo.modules.updates.events.IUpdatesEventManager
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.statemachine.UpdatesStateContext
import expo.modules.updates.statemachine.UpdatesStateEvent
import expo.modules.updates.statemachine.UpdatesStateEventType
import expo.modules.updates.statemachine.UpdatesStateMachine
import expo.modules.updates.statemachine.UpdatesStateValue
import org.json.JSONObject
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import java.lang.reflect.Field
import java.lang.reflect.InvocationTargetException
import java.lang.reflect.Method
import java.util.Date

@RunWith(AndroidJUnit4ClassRunner::class)
class UpdatesStateMachineInstrumentationTest {
  private fun UpdatesStateMachine.processEventTest(event: UpdatesStateEvent) {
    val method: Method = UpdatesStateMachine::class.java.getDeclaredMethod("processEvent", UpdatesStateEvent::class.java)
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

  private val androidContext = InstrumentationRegistry.getInstrumentation().context
  private val logger = UpdatesLogger(androidContext)

  // Test classes
  class TestStateChangeEventManager : IUpdatesEventManager {
    var lastEventType: UpdatesStateEventType? = null

    override var eventEmitter: EventEmitter? = null

    override fun sendStateMachineContextEvent(context: UpdatesStateContext) {
    }
  }

  @Test
  fun test_defaultState() {
    val testStateChangeEventManager = TestStateChangeEventManager()
    val machine = UpdatesStateMachine(logger, testStateChangeEventManager, UpdatesStateValue.values().toSet())
    Assert.assertEquals(UpdatesStateValue.Idle, machine.getState())
  }

  @Test
  fun test_handleCheckAndCheckCompleteAvailable() {
    val testStateChangeEventManager = TestStateChangeEventManager()
    val machine = UpdatesStateMachine(logger, testStateChangeEventManager, UpdatesStateValue.values().toSet())

    machine.processEventTest(UpdatesStateEvent.Check())

    Assert.assertEquals(UpdatesStateValue.Checking, machine.getState())
    Assert.assertEquals(UpdatesStateEventType.Check, testStateChangeEventManager.lastEventType)

    machine.processEventTest(
      UpdatesStateEvent.CheckCompleteWithUpdate(
        JSONObject("{\"updateId\":\"0000-xxxx\"}")
      )
    )
    Assert.assertEquals(UpdatesStateValue.Idle, machine.getState())
    Assert.assertFalse(machine.context.isChecking)
    Assert.assertTrue(machine.context.isUpdateAvailable)
    Assert.assertFalse(machine.context.isUpdatePending)
    Assert.assertEquals("0000-xxxx", machine.context.latestManifest?.get("updateId"))
    Assert.assertEquals(UpdatesStateEventType.CheckCompleteAvailable, testStateChangeEventManager.lastEventType)
  }

  @Test
  fun test_handleCheckCompleteUnavailable() {
    val testStateChangeEventManager = TestStateChangeEventManager()
    val machine = UpdatesStateMachine(logger, testStateChangeEventManager, UpdatesStateValue.values().toSet())

    machine.processEventTest(UpdatesStateEvent.Check())

    Assert.assertEquals(UpdatesStateValue.Checking, machine.getState())
    Assert.assertEquals(UpdatesStateEventType.Check, testStateChangeEventManager.lastEventType)

    machine.processEventTest(UpdatesStateEvent.CheckCompleteUnavailable())

    Assert.assertEquals(UpdatesStateValue.Idle, machine.getState())
    Assert.assertFalse(machine.context.isChecking)
    Assert.assertFalse(machine.context.isUpdateAvailable)
    Assert.assertFalse(machine.context.isUpdatePending)
    Assert.assertNull(machine.context.latestManifest)
    Assert.assertEquals(UpdatesStateEventType.CheckCompleteUnavailable, testStateChangeEventManager.lastEventType)
  }

  @Test
  fun test_handleDownloadAndDownloadComplete() {
    val testStateChangeEventManager = TestStateChangeEventManager()
    val machine = UpdatesStateMachine(logger, testStateChangeEventManager, UpdatesStateValue.values().toSet())

    machine.processEventTest(UpdatesStateEvent.Download())

    Assert.assertEquals(UpdatesStateValue.Downloading, machine.getState())
    Assert.assertEquals(UpdatesStateEventType.Download, testStateChangeEventManager.lastEventType)

    machine.processEventTest(
      UpdatesStateEvent.DownloadCompleteWithUpdate(
        JSONObject("{\"updateId\":\"0000-xxxx\"}")
      )
    )
    Assert.assertEquals(UpdatesStateValue.Idle, machine.getState())
    Assert.assertFalse(machine.context.isDownloading)
    Assert.assertNull(machine.context.downloadError)
    Assert.assertEquals("0000-xxxx", machine.context.latestManifest?.get("updateId"))
    Assert.assertEquals("0000-xxxx", machine.context.downloadedManifest?.get("updateId"))
    Assert.assertTrue(machine.context.isUpdateAvailable)
    Assert.assertTrue(machine.context.isUpdatePending)
    Assert.assertEquals(UpdatesStateEventType.DownloadComplete, testStateChangeEventManager.lastEventType)
  }

  @Test
  fun test_handleRollback() {
    val testStateChangeEventManager = TestStateChangeEventManager()
    val machine = UpdatesStateMachine(logger, testStateChangeEventManager, UpdatesStateValue.values().toSet())
    val commitTime = Date()
    machine.processEventTest(UpdatesStateEvent.Check())

    Assert.assertEquals(UpdatesStateValue.Checking, machine.getState())
    Assert.assertEquals(UpdatesStateEventType.Check, testStateChangeEventManager.lastEventType)

    machine.processEventTest(UpdatesStateEvent.CheckCompleteWithRollback(commitTime))
    Assert.assertEquals(UpdatesStateValue.Idle, machine.getState())
    Assert.assertFalse(machine.context.isChecking)
    Assert.assertNull(machine.context.checkError)
    Assert.assertTrue(machine.context.isUpdateAvailable)
    Assert.assertFalse(machine.context.isUpdatePending)
    Assert.assertEquals(commitTime, machine.context.rollback?.commitTime)
  }

  @Test
  fun test_checkError() {
    val testStateChangeEventManager = TestStateChangeEventManager()
    val machine = UpdatesStateMachine(logger, testStateChangeEventManager, UpdatesStateValue.values().toSet())

    machine.processEventTest(UpdatesStateEvent.Check())

    Assert.assertEquals(UpdatesStateValue.Checking, machine.getState())
    Assert.assertEquals(UpdatesStateEventType.Check, testStateChangeEventManager.lastEventType)

    machine.processEventTest(
      UpdatesStateEvent.CheckError("A serious error has occurred")
    )
    Assert.assertEquals(UpdatesStateValue.Idle, machine.getState())
    Assert.assertFalse(machine.context.isChecking)
    Assert.assertNotNull(machine.context.checkError)
    Assert.assertFalse(machine.context.isUpdateAvailable)
    Assert.assertFalse(machine.context.isUpdatePending)
    Assert.assertNull(machine.context.rollback)
  }

  @Test
  fun test_invalidTransitions() {
    val testStateChangeEventManager = TestStateChangeEventManager()
    val machine = UpdatesStateMachine(logger, testStateChangeEventManager, UpdatesStateValue.values().toSet())
    machine.processEventTest(UpdatesStateEvent.Check())
    Assert.assertEquals(UpdatesStateValue.Checking, machine.getState())

    // Test invalid transitions and ensure that state does not change
    Assert.assertThrows(AssertionError::class.java) {
      machine.processEventTest(UpdatesStateEvent.Download())
    }
    Assert.assertEquals(UpdatesStateValue.Checking, machine.getState())

    Assert.assertThrows(AssertionError::class.java) {
      machine.processEventTest(UpdatesStateEvent.DownloadComplete())
    }
    Assert.assertEquals(UpdatesStateValue.Checking, machine.getState())
  }

  @Test
  fun test_invalidStateValues() {
    val testStateChangeEventManager = TestStateChangeEventManager()
    // can only be idle
    val machine = UpdatesStateMachine(logger, testStateChangeEventManager, setOf(UpdatesStateValue.Idle))

    // Test invalid value and ensure that state does not change
    Assert.assertThrows(AssertionError::class.java) {
      machine.processEventTest(UpdatesStateEvent.Download())
    }
    Assert.assertEquals(UpdatesStateValue.Idle, machine.getState())
  }
}
