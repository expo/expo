package expo.modules.updates

import android.os.Bundle
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import expo.modules.manifests.core.Manifest
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4ClassRunner::class)
class UpdatesStateMachineInstrumentationTest {
  // Test classes
  class TestStateChangeEventSender : UpdatesStateChangeEventSender {
    var lastEventType: UpdatesStateEventType? = null
    var lastBody: Bundle? = null

    override fun sendUpdateStateChangeEventToBridge(
      eventType: UpdatesStateEventType,
      body: Bundle
    ) {
      lastEventType = eventType
      lastBody = body
    }
  }

  class TestManifest(json: JSONObject) : Manifest(json) {
    val updateId: String?
      get() {
        return json.getString("updateId")
      }

    override fun getStableLegacyID(): String? {
      return null
    }

    override fun getScopeKey(): String {
      return "test"
    }

    override fun getEASProjectID(): String? {
      return null
    }

    override fun getBundleURL(): String {
      return "https://test"
    }

    override fun getExpoGoSDKVersion(): String? {
      return null
    }

    override fun getAssets(): JSONArray? {
      return null
    }

    override fun getExpoGoConfigRootObject(): JSONObject? {
      return null
    }

    override fun getExpoClientConfigRootObject(): JSONObject? {
      return null
    }

    override fun getSlug(): String? {
      return null
    }

    override fun getAppKey(): String? {
      return null
    }
  }

  @Test
  fun test_defaultState() {
    val machine = UpdatesStateMachine()
    Assert.assertEquals(UpdatesStateValue.Idle, machine.state)
  }

  @Test
  fun test_handleCheckAndCheckCompleteAvailable() {
    val machine = UpdatesStateMachine()
    val testStateChangeEventSender = TestStateChangeEventSender()
    machine.changeEventSender = testStateChangeEventSender

    machine.processEvent(UpdatesStateEvent(UpdatesStateEventType.Check))

    Assert.assertEquals(UpdatesStateValue.Checking, machine.state)
    Assert.assertEquals(UpdatesStateEventType.Check, testStateChangeEventSender.lastEventType)

    machine.processEvent(
      UpdatesStateEvent(
        UpdatesStateEventType.CheckCompleteAvailable,
        mapOf(
          "manifest" to TestManifest(JSONObject("{\"updateId\":\"0000-xxxx\"}"))
        )
      )
    )
    Assert.assertEquals(UpdatesStateValue.Idle, machine.state)
    Assert.assertFalse(machine.context.isChecking)
    Assert.assertTrue(machine.context.isUpdateAvailable)
    Assert.assertFalse(machine.context.isUpdatePending)
    Assert.assertEquals("0000-xxxx", (machine.context.latestManifest as? TestManifest)?.updateId ?: "")
    Assert.assertEquals(UpdatesStateEventType.CheckCompleteAvailable, testStateChangeEventSender.lastEventType)
  }

  @Test
  fun test_handleCheckCompleteUnavailable() {
    val machine = UpdatesStateMachine()
    val testStateChangeEventSender = TestStateChangeEventSender()
    machine.changeEventSender = testStateChangeEventSender

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
}
