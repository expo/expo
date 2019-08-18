package host.exp.exponent;

import android.Manifest;
import android.support.test.espresso.Espresso;
import android.support.test.rule.GrantPermissionRule;

import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.FixMethodOrder;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.RuleChain;
import org.junit.runner.RunWith;
import org.junit.runners.MethodSorters;

import host.exp.exponent.annotations.ExpoAlwaysPassThroughFilter;
import host.exp.exponent.annotations.ExpoDevModeTest;
import host.exp.exponent.utils.ExpoTestRunner;
import host.exp.exponent.utils.LoadingScreenIdlingResource;
import host.exp.exponent.utils.RetryTestRule;
import host.exp.exponent.utils.TestReporterRule;
import host.exp.exponent.utils.TestServerUtils;

@RunWith(ExpoTestRunner.class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class DevModeTests extends BaseTestClass {

  @BeforeClass
  public static void beforeClass() {
    BaseTestClass.beforeClass();
  }

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
  public RuleChain chain = RuleChain.outerRule(new TestReporterRule()).around(new RetryTestRule(3));

  @Rule
  public GrantPermissionRule permissionRule = GrantPermissionRule.grant(Manifest.permission.SYSTEM_ALERT_WINDOW);

  @Test
  @ExpoAlwaysPassThroughFilter
  public void junitIsSillyAndWillFailIfThereIsntOneTestRunPerFile() {

  }
}
