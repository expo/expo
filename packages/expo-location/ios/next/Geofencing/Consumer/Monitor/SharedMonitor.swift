import CoreLocation

/// Owns the one `CLMonitor` for a task name for the lifetime of the process.
///
/// CLMonitor forces this shape:
/// - Opening a second `CLMonitor` with a name that is already open crashes the process with an
///   uncatchable exception.
/// - After the instance deallocates, iOS frees the name asynchronously and does not say when, so a
///   safe reopen is impossible. The instance is kept alive forever and `MonitorRegistry` hands it out.
/// - `events` is one-shot: once its iteration ends or is cancelled, the instance never yields again.
///   One permanent loop iterates it and delivers to the currently attached receiver. Sources attach
///   and detach; they never iterate `events` themselves.
///
/// Region updates go through a FIFO stream so a stop followed by a start cannot reorder.
///
/// If the events loop ends, the monitor is dead for this process: every later `attach` is finished
/// with the same error and the only recovery is an app restart.
@available(iOS 17, *)
final class SharedMonitor {
  private let instance: Task<CLMonitor, Never>
  private let pendingRegionUpdates: AsyncStream<[GeofencingRegion]>.Continuation
  private let lock = NSLock()
  private var receiver: AsyncThrowingStream<GeofencingEvent, Error>.Continuation?
  private var ended: Error?
  private let delivered = DeliveredEvents()

  init(name: String) {
    let (regionUpdates, pendingRegionUpdates) = AsyncStream.makeStream(of: [GeofencingRegion].self)
    self.pendingRegionUpdates = pendingRegionUpdates
    instance = Task { await CLMonitor(name) }
    Task { [instance] in
      await instance.value.forward(to: self)
    }
    Task { [instance] in
      for await regions in regionUpdates {
        await instance.value.set(regions: regions)
      }
    }
  }

  var isAttached: Bool {
    lock.withLock { receiver != nil }
  }

  func attach(_ receiver: AsyncThrowingStream<GeofencingEvent, Error>.Continuation) {
    lock.withLock {
      if let ended {
        receiver.finish(throwing: ended)
        return
      }
      self.receiver?.finish()
      self.receiver = receiver
    }
  }

  func set(regions: [GeofencingRegion]) {
    pendingRegionUpdates.yield(regions)
  }

  func deliver(_ event: MonitorEvent) {
    lock.withLock {
      if let failure = event.failure {
        receiver?.finish(throwing: failure)
        receiver = nil
        return
      }
      guard delivered.admit(event), let geofencingEvent = GeofencingEvent(event) else {
        return
      }
      receiver?.yield(geofencingEvent)
    }
  }

  func end(_ error: Error?) {
    lock.withLock {
      let failure = error ?? GeofencingMonitorEnded()
      ended = failure
      receiver?.finish(throwing: failure)
      receiver = nil
    }
  }
}
