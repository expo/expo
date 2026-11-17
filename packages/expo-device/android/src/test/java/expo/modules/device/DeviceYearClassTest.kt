package expo.modules.device

import android.os.Build
import org.junit.Assert.assertEquals
import org.junit.Test

private const val GB = 1024L * 1024L * 1024L

class DeviceYearClassTest {
  @Test
  fun usesTheReleaseYearOfKnownHighEndChips() {
    val expected = mapOf(
      "SM8650" to 2024,
      "SM8750P" to 2025,
      "SM8475" to 2022,
      "Exynos 2100" to 2021,
      "s5e9945" to 2024,
      "Tensor" to 2021,
      "Tensor G4" to 2024,
      "MT6991" to 2025
    )

    for ((socModel, year) in expected) {
      assertEquals(socModel, year, DeviceYearClass.calculate(totalMemory = 8 * GB, socModel = socModel))
    }
  }

  @Test
  fun extrapolatesChipsThatAreNewerThanTheCode() {
    assertEquals(2027, DeviceYearClass.calculate(totalMemory = 12 * GB, socModel = "SM8950"))
    assertEquals(2027, DeviceYearClass.calculate(totalMemory = 12 * GB, socModel = "Exynos 2700"))
    assertEquals(2027, DeviceYearClass.calculate(totalMemory = 12 * GB, socModel = "Tensor G7"))
  }

  @Test
  fun usesTheMemoryOfDevicesWithAnUnknownChip() {
    assertEquals(2016, DeviceYearClass.calculate(totalMemory = 8 * GB, socModel = "SM7325"))
    assertEquals(2014, DeviceYearClass.calculate(totalMemory = 3 * GB, socModel = Build.UNKNOWN))
  }
}
