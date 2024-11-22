package expo.modules.benchmark

import com.facebook.react.ReactPackage

fun withBenchmarkingPackages(packages: ArrayList<ReactPackage>): ArrayList<ReactPackage> {
  return packages.apply {
    add(BenchmarkingPackage())
    add(BenchmarkingTurboPackage())
  }
}
