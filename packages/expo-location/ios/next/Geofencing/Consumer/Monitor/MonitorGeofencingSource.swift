import CoreLocation

@available(iOS 17, *)
final class MonitorGeofencingSource: GeofencingSource {
  let updates: AsyncThrowingStream<GeofencingEvent, Error>
  private let monitor: SharedMonitor

  init(options: GeofencingTaskOptions) {
    let (stream, continuation) = AsyncThrowingStream.makeStream(of: GeofencingEvent.self)
    updates = stream
    monitor = MonitorRegistry.monitor(named: options.name)
    monitor.attach(continuation)
    monitor.set(regions: options.regions)
  }

  var hasEnded: Bool {
    !monitor.isAttached
  }

  func setRegions(_ regions: [GeofencingRegion]) {
    monitor.set(regions: regions)
  }

  func stop() {
    monitor.set(regions: [])
  }
}
