package expo.modules.mediasession

import org.junit.Assert.assertEquals
import org.junit.Test

class AppVisibilityTest {
  private val events = mutableListOf<String>()
  private val visibility = AppVisibility(onBackground = { events.add("background") }, onForeground = { events.add("foreground") })

  @Test
  fun lastStopReportsBackground() {
    visibility.started(1)
    visibility.stopped(1, isChangingConfigurations = false)
    visibility.started(1)

    assertEquals(listOf("foreground", "background", "foreground"), events)
  }

  @Test
  fun configurationChangeReportsNothing() {
    visibility.started(1)
    visibility.stopped(1, isChangingConfigurations = true)
    visibility.started(2)

    assertEquals(listOf("foreground"), events)
  }

  @Test
  fun secondActivityKeepsTheAppVisible() {
    visibility.started(1)
    visibility.started(2)
    visibility.stopped(1, isChangingConfigurations = false)

    assertEquals(listOf("foreground"), events)
  }

  @Test
  fun activityStartedBeforeTrackingReportsBackgroundOnStop() {
    visibility.stopped(1, isChangingConfigurations = false)

    assertEquals(listOf("background"), events)
  }
}
