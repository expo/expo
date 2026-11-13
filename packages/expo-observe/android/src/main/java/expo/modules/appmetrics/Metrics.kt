package expo.modules.appmetrics

internal enum class AppStartupMetric(
  val metricName: String
) {
  ColdLaunchTime("coldLaunchTime"),
  WarmLaunchTime("warmLaunchTime"),
  TimeToInteractive("timeToInteractive"),
  TimeToFirstRender("timeToFirstRender"),
  BundleLoadTime("bundleLoadTime");

  companion object {
    val category = MetricCategory.AppStartup
  }
}

internal enum class MemoryMetric(
  val metricName: String
) {
  Physical("physical"),
  Available("available"),
  JavaHeap("javaHeap");

  companion object {
    val category = MetricCategory.Memory
  }
}

internal enum class MetricCategory(
  val categoryName: String
) {
  AppStartup("appStartup"),
  Memory("memory"),
  Updates("updates"),
  Navigation("navigation")
}
