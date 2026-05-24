package dev.expo.payments.macrobenchmark

import android.content.Intent
import androidx.benchmark.macro.StartupMode
import androidx.benchmark.macro.StartupTimingMetric
import androidx.benchmark.macro.junit4.MacrobenchmarkRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Until
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class StartupBenchmark {
  @get:Rule
  val benchmarkRule = MacrobenchmarkRule()

  @Test
  fun startupCold() =
    benchmarkRule.measureRepeated(
      packageName = "dev.expo.payments",
      metrics = listOf(StartupTimingMetric()),
      iterations = 5,
      startupMode = StartupMode.COLD,
    ) {
      startActivityAndWait(
        Intent(Intent.ACTION_MAIN).apply {
          setClassName("dev.expo.payments", "dev.expo.payments.MainActivity")
        }
      )
      device.wait(Until.hasObject(By.text("Expo Test Suite")), 15_000)
      device.waitForIdle()
    }
}
