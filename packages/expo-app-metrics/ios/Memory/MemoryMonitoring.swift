struct MemoryMonitoringData: Sendable {
  /// Total number of memory warnings sent by the system.
  var warningsCount: Int = .zero

  /// Snapshot of the memory usage taken while the last memory warning occurred.
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
      AppMetrics.mainSession.receiveLog(
        makeMemoryWarningLogRecord(snapshot: snapshot, warningsCount: data.warningsCount))
    }
  }
}

/// Builds the internal `expo.memory.warning` log event emitted when the system delivers a low-memory
/// warning. The memory usage snapshot taken at warning time rides as `expo.memory.*` attributes,
/// and `expo.memory.warningsCount` carries how many warnings this session has seen so far.
///
/// Emitted via `receiveLog` directly rather than the JS `logEvent` path, so the SDK-reserved `expo.`
/// event name and `expo.memory.*` attribute keys bypass the validation that would otherwise drop them.
func makeMemoryWarningLogRecord(snapshot: MemoryUsageSnapshot, warningsCount: Int) -> LogRecord {
  var attributes: [String: Any] = [
    "expo.memory.allocated": snapshot.memoryFootprint,
    "expo.memory.physical": snapshot.residentSize,
    "expo.memory.warningsCount": warningsCount,
  ]
  // `freeMemory` (`os_proc_available_memory()`) counts down from the process' jetsam limit, which
  // only exists on a real device (the simulator has no limit and always reports 0). Omit the
  // attribute in that case rather than record a meaningless 0.
  if snapshot.freeMemory > 0 {
    attributes["expo.memory.available"] = snapshot.freeMemory
  }
  return LogRecord(
    name: "expo.memory.warning",
    attributes: attributes,
    severity: .warn
  )
}
