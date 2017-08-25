package host.exp.exponent.utils;

import android.support.test.uiautomator.Configurator;
import android.support.test.uiautomator.UiDevice;
import android.support.test.uiautomator.UiSelector;

import com.azimolabs.conditionwatcher.ConditionWatcher;
import com.azimolabs.conditionwatcher.Instruction;

import static android.support.test.espresso.Espresso.onView;
import static android.support.test.espresso.assertion.ViewAssertions.matches;
import static android.support.test.espresso.matcher.ViewMatchers.isDisplayed;
import static android.support.test.espresso.matcher.ViewMatchers.withText;

public class ExpoConditionWatcher {

  public static void waitForText(final UiDevice device, final String text) throws Exception {
    ConditionWatcher.waitForCondition(new Instruction() {
      @Override
      public String getDescription() {
        return text + " text should exist";
      }

      @Override
      public boolean checkCondition() {
        Configurator.getInstance().setWaitForSelectorTimeout(1000);
        UiSelector selector = new UiSelector().text(text);
        return device.findObject(selector).exists();
      }
    });
    onView(withText(text)).check(matches(isDisplayed()));
  }
}
