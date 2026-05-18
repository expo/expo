struct MemoryMonitoringData: Sendable {
  /**
   Total number of memory warnings sent by the system.
   */
  var warningsCount: Int = .zero

  /**
   Snapshot of the memory usage taken while the last memory warning occurred.
   */
  var lastMemoryUsageSnapshot: MemoryUsageSnapshot? = nil
}

@AppMetricsActor
final class MemoryMonitoring: MetricReporter, Sendable {
  var data = MemoryMonitoringData()

  nonisolated func receivedMemoryWarning() {
    // Get the snapshot before asynchronously jumping to app metrics' isolation. This operation might be a bit expensive,
    // but we want the snapshot to be taken as early as possible, before other observers free up some memory.
    let snapshot = MemoryUsageSnapshot.getCurrent()

    AppMetricsActor.isolated { [self] in
      data = MemoryMonitoringData(
        warningsCount: data.warningsCount + 1,
        lastMemoryUsageSnapshot: snapshot
      )
      reportMetrics(snapshot)
      print(snapshot)
    }
  }
}
