package expo.modules.mediasession

import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestCoroutineScheduler
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class JSSessionUseTest {
  private val scheduler = TestCoroutineScheduler()
  private val backend = FakeSessionBackend()
  private val manager = MediaSessionManager(backend, StandardTestDispatcher(scheduler)).apply {
    coordinator.log = {}
    setPolicy(AudioPolicyUpdate(interruptionMode = InterruptionMode.DO_NOT_MIX))
  }

  @After
  fun tearDown() {
    manager.coordinator.close()
    scheduler.runCurrent()
  }

  @Test
  fun beginsAUseWithTheRequirements() {
    val requirements = SessionRequirementsRecord(
      mixing = MixingRequirement.DO_NOT_MIX,
      capabilities = listOf("record", "unknown"),
      continuesInBackground = true
    ).toRequirements()
    val use = JSSessionUse(manager, "js", requirements)
    scheduler.runCurrent()

    assertEquals(1, manager.coordinator.useCount)
    assertEquals(setOf(SessionCapability.RECORD), requirements.capabilities)
    use.end()
  }

  @Test
  fun endEndsTheUseOnce() {
    val use = JSSessionUse(manager, "js", SessionRequirements())
    scheduler.runCurrent()
    use.end()
    use.end()
    scheduler.runCurrent()

    assertEquals(0, manager.coordinator.useCount)
  }
}
