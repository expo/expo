// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoAppMetrics

/// Runs dispatch passes one at a time, so a later caller waits for the pass ahead of it instead
/// of overlapping with it.
///
/// `ObservabilityManager` is actor-isolated but reentrant at every network `await`, so two
/// overlapping passes would read and send the same pending rows before either advanced its cursor
/// or deleted its batch. Serializing also lets a JS `dispatchEvents()` promise mean the queue was
/// drained, matching Android's per-signal mutexes.
@AppMetricsActor
internal final class DispatchSerializer {
  private var inFlight: Task<Void, Never>?
  private var generation = 0
  private var inFlightGeneration = 0

  /// Waits for any pass already running, then runs `work` as the new in-flight pass.
  internal func run(_ work: @escaping () async -> Void) async {
    // The predecessor is captured and awaited *inside* the new task, not before creating it.
    // Awaiting first would suspend, letting two callers both observe a finished pass and start
    // work concurrently. Chaining publishes this task synchronously, so the next caller links
    // behind it.
    let predecessor = inFlight
    generation += 1
    let ownGeneration = generation
    let task = Task {
      await predecessor?.value
      await work()
    }
    inFlight = task
    inFlightGeneration = ownGeneration
    await task.value
    // Cleared only when still the current pass, so a caller resuming late cannot orphan the pass
    // that replaced it.
    if inFlightGeneration == ownGeneration {
      inFlight = nil
    }
  }
}
