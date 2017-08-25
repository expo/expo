package host.exp.exponent;

import android.support.test.espresso.Espresso;
import android.support.test.runner.AndroidJUnit4;

import org.junit.After;
import org.junit.Before;
import org.junit.FixMethodOrder;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.MethodSorters;

import host.exp.exponent.utils.LoadingScreenIdlingResource;
import host.exp.exponent.utils.RetryTestRule;
import host.exp.exponent.utils.TestServerUtils;

@RunWith(AndroidJUnit4.class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class DevModeTests extends BaseTestClass {

  @Before
  public void before() {
    // Setup Espresso
    mLoadingScreenIdlingResource = new LoadingScreenIdlingResource();
    Espresso.registerIdlingResources(mLoadingScreenIdlingResource);
  }

  @After
  public void after() {
    Espresso.unregisterIdlingResources(mLoadingScreenIdlingResource);
  }

  @Rule
  public RetryTestRule retry = new RetryTestRule(3);

  @Test
  public void sdk18LiveReload() throws Exception {
    TestServerUtils.runFixtureTest(sUiDevice, "android-sdk18-live-reload");
  }

  @Test
  public void sdk19LiveReload() throws Exception {
    TestServerUtils.runFixtureTest(sUiDevice, "android-sdk19-live-reload");
  }

  @Test
  public void sdk20LiveReload() throws Exception {
    TestServerUtils.runFixtureTest(sUiDevice, "android-sdk20-live-reload");
  }

  @Test
  public void sdk21LiveReload() throws Exception {
    TestServerUtils.runFixtureTest(sUiDevice, "android-sdk21-live-reload");
  }
}
