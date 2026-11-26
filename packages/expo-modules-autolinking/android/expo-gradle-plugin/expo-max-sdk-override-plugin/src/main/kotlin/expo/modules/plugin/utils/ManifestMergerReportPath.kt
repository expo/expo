package expo.modules.plugin.utils

/**
 * Path (relative to the module build directory) of the manifest merger blame report that AGP writes
 * for a variant. AGP names it after the variant base name: every product flavor name, in dimension
 * order, followed by the build type, joined with `-` (e.g. `free-minApi24-debug`).
 * `variant.flavorName` can't be used here because for more than one flavor dimension AGP merges the
 * flavor names into one camelCase word (`freeMinApi24`), which doesn't match the file name.
 */
fun manifestMergerReportPath(productFlavors: List<String>, buildType: String?): String {
  val baseName = (productFlavors + listOfNotNull(buildType)).joinToString("-")
  return "outputs/logs/manifest-merger-$baseName-report.txt"
}
