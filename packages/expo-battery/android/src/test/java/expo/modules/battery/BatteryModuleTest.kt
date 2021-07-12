import android.content.Context
import androidx.test.core.app.ApplicationProvider
import expo.modules.battery.BatteryModule
import io.mockk.MockK

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.unimodules.test.core.PromiseMock
import org.unimodules.test.core.assertResolved

@RunWith(RobolectricTestRunner::class)
class BatteryModuleTest {

  private lateinit var module: BatteryModule

  @Before
  fun initializeMock() {
    module = BatteryModule(ApplicationProvider.getApplicationContext())
  }

  @Test
  fun getBatteryLevel() {
    val promise = PromiseMock()
    val batteryLevelExpected = -1
    module.getBatteryLevelAsync(promise)
    assertResolved(promise)
    assertEquals(batteryLevelExpected, promise.resolveValue)
  }

  @Test
  fun getBatteryState() {
    val promise = PromiseMock()
    val batteryStateExpected = BatteryModule.BatteryState.UNKNOWN.value
    module.getBatteryStateAsync(promise)
    assertResolved(promise)
    assertEquals(batteryStateExpected, promise.resolveValue)
  }

  @Test
  fun isBatteryOptimizationEnabled() {
    val promise = PromiseMock()
    module.isBatteryOptimizationEnabledAsync(promise)
    assertResolved(promise)
  }
}