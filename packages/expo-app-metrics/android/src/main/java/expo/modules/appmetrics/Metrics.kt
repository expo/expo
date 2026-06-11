package expo.modules.appmetrics

enum class AppStartupMetric(
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

enum class MetricCategory(
  val categoryName: String
) {
  AppStartup("appStartup"),
  Memory("memory"),
  Updates("updates"),
  Navigation("navigation")
}
