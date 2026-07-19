package host.exp.exponent

import androidx.test.InstrumentationRegistry
import androidx.test.espresso.IdlingPolicies
import androidx.test.uiautomator.UiDevice
import host.exp.exponent.kernel.KernelConfig
import host.exp.exponent.utils.TestNativeModuleServer
import java.util.concurrent.TimeUnit

const val LAUNCH_TIMEOUT = 5000

open class BaseTestClass {
  companion object {
    @JvmStatic protected lateinit var uiDevice: UiDevice

    fun beforeClass() {
      KernelConfig.IS_TEST = true
      KernelConfig.FORCE_NO_KERNEL_DEBUG_MODE = true
      KernelConfig.HIDE_ONBOARDING = true

      uiDevice = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
      TestNativeModuleServer.instance.uiDevice = uiDevice

      // Increase Espresso timeout
      IdlingPolicies.setMasterPolicyTimeout(3, TimeUnit.MINUTES)
      IdlingPolicies.setIdlingResourceTimeout(3, TimeUnit.MINUTES)
    }
  }
}
