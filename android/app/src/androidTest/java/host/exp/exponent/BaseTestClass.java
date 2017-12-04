package host.exp.exponent;

import android.support.test.InstrumentationRegistry;
import android.support.test.espresso.IdlingPolicies;
import android.support.test.espresso.IdlingResource;
import android.support.test.uiautomator.UiDevice;

import org.junit.BeforeClass;

import java.util.concurrent.TimeUnit;

import host.exp.exponent.kernel.KernelConfig;
import host.exp.exponent.utils.DeviceUtils;
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
    KernelConfig.HIDE_NUX = true;

    sUiDevice = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
    TestNativeModuleServer.getInstance().setUiDevice(sUiDevice);

    // Increase Espresso timeout
    IdlingPolicies.setMasterPolicyTimeout(3, TimeUnit.MINUTES);
    IdlingPolicies.setIdlingResourceTimeout(3, TimeUnit.MINUTES);
  }

}
