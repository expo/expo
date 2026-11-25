package expo.modules.device

import android.os.Build

private const val MB = 1024L * 1024L

// The second digit of a Snapdragon 8 part number grows by one each year. SM8150 (Snapdragon 855) is the 2019 chip.
private val snapdragonFlagship = Regex("SM8(\\d)(?:50|75)\\w*")

// Exynos 2100 is the 2021 chip. Newer Samsung builds report the part number instead: s5e9925 is Exynos 2200.
private val exynosFlagship = Regex("Exynos 2(\\d)00|s5e99(\\d)5", RegexOption.IGNORE_CASE)

// The first Tensor chip (2021) reports "Tensor". The chips after it report "Tensor G2", "Tensor G3", and so on.
private val tensor = Regex("Tensor(?: G(\\d+))?")

// High-end chips that do not follow a naming pattern.
private val chipYears = mapOf(
  "SDM845" to 2018,
  "Exynos 9820" to 2019,
  "Exynos 9825" to 2019,
  "Exynos 990" to 2020,
  "MT6983" to 2022, // Dimensity 9000
  "MT6985" to 2023, // Dimensity 9200
  "MT6989" to 2024, // Dimensity 9300
  "MT6991" to 2025, // Dimensity 9400
  "MT6993" to 2026 // Dimensity 9500
)

/**
 * The year in which a device with the same specifications was a high-end device.
 * A known high-end chip gives the year of the devices that it was made for.
 * Other devices get the memory tiers of Facebook's device-year-class library, which stop at 2016.
 */
internal object DeviceYearClass {
  fun get(totalMemory: Long): Int {
    val socModel = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      Build.SOC_MODEL
    } else {
      null
    }
    return calculate(totalMemory, socModel)
  }

  fun calculate(totalMemory: Long, socModel: String?): Int {
    return socModel?.let(::yearClassFromChip) ?: yearClassFromMemory(totalMemory)
  }

  private fun yearClassFromChip(socModel: String): Int? {
    snapdragonFlagship.matchEntire(socModel)?.let {
      return 2018 + it.groupValues[1].toInt()
    }
    exynosFlagship.matchEntire(socModel)?.let {
      return 2020 + it.groupValues[1].ifEmpty { it.groupValues[2] }.toInt()
    }
    tensor.matchEntire(socModel)?.let {
      return 2020 + (it.groupValues[1].toIntOrNull() ?: 1)
    }
    // MediaTek can add a suffix to the part number, for example "MT6877V/TTZA".
    return chipYears[socModel] ?: chipYears[socModel.take(6)]
  }

  // Facebook's library also reads the CPU speed for 1.5 GB of memory or less. These tiers use its result for a fast CPU.
  private fun yearClassFromMemory(totalMemory: Long): Int {
    return when {
      totalMemory <= 768 * MB -> 2010
      totalMemory <= 1024 * MB -> 2012
      totalMemory <= 2048 * MB -> 2013
      totalMemory <= 3072 * MB -> 2014
      totalMemory <= 5120 * MB -> 2015
      else -> 2016
    }
  }
}
