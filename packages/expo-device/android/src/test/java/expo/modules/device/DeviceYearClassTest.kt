package expo.modules.device

import android.os.Build
import org.junit.Assert.assertEquals
import org.junit.Test

private const val GB = 1024L * 1024L * 1024L

class DeviceYearClassTest {
  @Test
  fun usesMediaPerformanceClassForNewerHighEndDevices() {
    val yearClass = DeviceYearClass.calculate(
      totalMemory = 8 * GB,
      mediaPerformanceClass = Build.VERSION_CODES.TIRAMISU,
      cpuCores = { 8 },
      cpuMaxFreqKHz = { 3_000_000 }
    )

    assertEquals(2022, yearClass)
  }

  @Test
  fun extrapolatesMediaPerformanceClassesNewerThanTheTable() {
    val yearClass = DeviceYearClass.calculate(
      totalMemory = 12 * GB,
      mediaPerformanceClass = Build.VERSION_CODES.BAKLAVA + 2,
      cpuCores = { 8 },
      cpuMaxFreqKHz = { 3_000_000 }
    )

    assertEquals(2027, yearClass)
  }
}
