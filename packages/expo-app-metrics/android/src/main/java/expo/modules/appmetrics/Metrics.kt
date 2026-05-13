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

enum class FrameRateMetric(
  val metricName: String
) {
  RenderedFrames("renderedFrames"),
  ExpectedFrames("expectedFrames"),
  DroppedFrames("droppedFrames"),
  FrozenFrames("frozenFrames"),
  SlowFrames("slowFrames"),
  FreezeTime("freezeTime"),
  SessionDuration("sessionDuration");

  companion object {
    val category = MetricCategory.FrameRate
  }
}

enum class MemoryMetric(
  val metricName: String
) {
  Physical("physical"),
  Available("available"),
  JavaHeap("javaHeap");

  companion object {
    val category = MetricCategory.Memory
  }
}

enum class MetricCategory(
  val categoryName: String
) {
  AppStartup("appStartup"),
  FrameRate("frameRate"),
  Memory("memory"),
  Updates("updates"),
  Navigation("navigation")
}
