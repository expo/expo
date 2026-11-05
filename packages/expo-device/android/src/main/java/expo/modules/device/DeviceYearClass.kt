package expo.modules.device

import android.os.Build
import java.io.File
import kotlin.math.max

private const val MB = 1024L * 1024L
private const val MHZ_IN_KHZ = 1000

/**
 * The year in which the media performance class of each Android release was the high-end standard.
 * A class that is newer than this table is one year newer for each SDK level after the last entry,
 * because Android ships one major release each year.
 */
private val mediaPerformanceClassYears = sortedMapOf(
  Build.VERSION_CODES.R to 2020,
  Build.VERSION_CODES.S to 2021,
  Build.VERSION_CODES.TIRAMISU to 2022,
  Build.VERSION_CODES.UPSIDE_DOWN_CAKE to 2023,
  Build.VERSION_CODES.VANILLA_ICE_CREAM to 2024,
  Build.VERSION_CODES.BAKLAVA to 2025
)

/**
 * The year in which a device with the same specifications would have been a high-end device.
 * The memory and CPU tiers are the same as in Facebook's device-year-class library, which stops at 2016.
 * A device that declares a media performance class can get a newer year.
 */
internal object DeviceYearClass {
  @Volatile
  private var cachedYearClass: Int? = null

  fun get(totalMemory: Long): Int {
    cachedYearClass?.let { return it }
    val yearClass = calculate(
      totalMemory = totalMemory,
      mediaPerformanceClass = mediaPerformanceClass(),
      cpuCores = ::cpuCores,
      cpuMaxFreqKHz = ::cpuMaxFreqKHz
    )
    cachedYearClass = yearClass
    return yearClass
  }

  fun calculate(
    totalMemory: Long,
    mediaPerformanceClass: Int,
    cpuCores: () -> Int,
    cpuMaxFreqKHz: () -> Int
  ): Int {
    return max(
      yearClassFromSpecs(totalMemory, cpuCores, cpuMaxFreqKHz),
      yearClassFromMediaPerformanceClass(mediaPerformanceClass)
    )
  }

  private fun yearClassFromSpecs(totalMemory: Long, cpuCores: () -> Int, cpuMaxFreqKHz: () -> Int): Int {
    return when {
      totalMemory <= 768 * MB -> if (cpuCores() <= 1) {
        2009
      } else {
        2010
      }
      totalMemory <= 1024 * MB -> if (cpuMaxFreqKHz() < 1300 * MHZ_IN_KHZ) {
        2011
      } else {
        2012
      }
      totalMemory <= 1536 * MB -> if (cpuMaxFreqKHz() < 1800 * MHZ_IN_KHZ) {
        2012
      } else {
        2013
      }
      totalMemory <= 2048 * MB -> 2013
      totalMemory <= 3072 * MB -> 2014
      totalMemory <= 5120 * MB -> 2015
      else -> 2016
    }
  }

  private fun yearClassFromMediaPerformanceClass(mediaPerformanceClass: Int): Int {
    val knownClasses = mediaPerformanceClassYears.headMap(mediaPerformanceClass + 1)
    if (knownClasses.isEmpty()) {
      return -1
    }
    val knownClass = knownClasses.lastKey()
    val year = knownClasses.getValue(knownClass)
    return if (knownClass == mediaPerformanceClassYears.lastKey()) {
      year + (mediaPerformanceClass - knownClass)
    } else {
      year
    }
  }

  private fun mediaPerformanceClass(): Int {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      Build.VERSION.MEDIA_PERFORMANCE_CLASS
    } else {
      0
    }
  }

  private fun cpuCores(): Int {
    return coresFromRange("/sys/devices/system/cpu/possible")
      ?: coresFromRange("/sys/devices/system/cpu/present")
      ?: File("/sys/devices/system/cpu/").listFiles { file -> file.name.matches(Regex("cpu[0-9]+")) }?.size
      ?: -1
  }

  private fun coresFromRange(path: String): Int? {
    val range = runCatching { File(path).bufferedReader().use { it.readLine() } }.getOrNull() ?: return null
    if (!range.matches(Regex("0-\\d+"))) {
      return null
    }
    return range.substring(2).toInt() + 1
  }

  private fun cpuMaxFreqKHz(): Int {
    var maxFreq = -1
    for (core in 0 until cpuCores()) {
      val freq = runCatching {
        File("/sys/devices/system/cpu/cpu$core/cpufreq/cpuinfo_max_freq").readText().takeWhile { it.isDigit() }.toInt()
      }.getOrNull() ?: continue
      maxFreq = max(maxFreq, freq)
    }
    if (maxFreq == -1) {
      val cpuMHz = runCatching {
        File("/proc/cpuinfo").useLines { lines ->
          lines.firstOrNull { it.startsWith("cpu MHz") }?.let { Regex("\\d+").find(it)?.value?.toInt() }
        }
      }.getOrNull()
      if (cpuMHz != null) {
        maxFreq = cpuMHz * MHZ_IN_KHZ
      }
    }
    return maxFreq
  }
}
