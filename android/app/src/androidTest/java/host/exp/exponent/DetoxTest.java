package host.exp.exponent;

import android.support.test.filters.LargeTest;
import android.support.test.rule.ActivityTestRule;
import android.support.test.runner.AndroidJUnit4;

import com.wix.detox.Detox;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Created by simonracz on 28/05/2017.
 */

@RunWith(AndroidJUnit4.class)
@LargeTest
public class DetoxTest {

  @Rule
  public ActivityTestRule<LauncherActivity> mActivityRule = new ActivityTestRule<>(LauncherActivity.class, false, false);

  @Test
  public void runDetoxTests() {
    Detox.runTests(mActivityRule);
  }
}