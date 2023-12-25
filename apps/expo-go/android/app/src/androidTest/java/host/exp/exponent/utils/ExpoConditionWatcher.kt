package host.exp.exponent.utils

import androidx.test.uiautomator.UiDevice
import com.azimolabs.conditionwatcher.ConditionWatcher
import androidx.test.uiautomator.UiSelector
import androidx.test.espresso.Espresso
import androidx.test.espresso.matcher.ViewMatchers
import androidx.test.espresso.assertion.ViewAssertions
import androidx.test.uiautomator.Configurator
import com.azimolabs.conditionwatcher.Instruction
import java.lang.Exception

object ExpoConditionWatcher {
  @Throws(Exception::class)
  fun waitForText(device: UiDevice, text: String) {
    ConditionWatcher.waitForCondition(object : Instruction() {
      override fun getDescription(): String {
        return "$text text should exist"
      }

      override fun checkCondition(): Boolean {
        Configurator.getInstance().waitForSelectorTimeout = 1000
        val selector = UiSelector().text(text)
        return device.findObject(selector).exists()
      }
    })
    Espresso.onView(ViewMatchers.withText(text))
      .check(ViewAssertions.matches(ViewMatchers.isDisplayed()))
  }
}
