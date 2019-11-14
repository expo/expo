package host.exp.exponent.utils;

import androidx.test.uiautomator.Configurator;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiSelector;

import com.azimolabs.conditionwatcher.ConditionWatcher;
import com.azimolabs.conditionwatcher.Instruction;

import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.assertion.ViewAssertions.matches;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static androidx.test.espresso.matcher.ViewMatchers.withText;

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
