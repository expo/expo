package host.exp.exponent;

import androidx.test.InstrumentationRegistry;
import androidx.test.espresso.IdlingPolicies;
import androidx.test.espresso.IdlingResource;
import androidx.test.uiautomator.UiDevice;

import java.util.concurrent.TimeUnit;

import host.exp.exponent.kernel.KernelConfig;
import host.exp.exponent.utils.ElapsedTimeIdlingResource;
import host.exp.exponent.utils.JSTestRunnerIdlingResource;
import host.exp.exponent.utils.TestNativeModuleServer;

public class BaseTestClass {

  protected static final int LAUNCH_TIMEOUT = 5000;

  protected static UiDevice sUiDevice;

  protected IdlingResource mLoadingScreenIdlingResource;
  protected ElapsedTimeIdlingResource mElapsedTimeIdlingResource;
  protected JSTestRunnerIdlingResource mJSTestRunnerIdlingResource;

  public static void beforeClass() {
    KernelConfig.IS_TEST = true;
    KernelConfig.FORCE_NO_KERNEL_DEBUG_MODE = true;
    KernelConfig.HIDE_ONBOARDING = true;

    sUiDevice = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
    TestNativeModuleServer.getInstance().setUiDevice(sUiDevice);

    // Increase Espresso timeout
    IdlingPolicies.setMasterPolicyTimeout(3, TimeUnit.MINUTES);
    IdlingPolicies.setIdlingResourceTimeout(3, TimeUnit.MINUTES);
  }

}
