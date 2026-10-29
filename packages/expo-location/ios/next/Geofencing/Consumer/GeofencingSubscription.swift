import Foundation

final class GeofencingSubscription {
  private let source: GeofencingSource
  private var consumer: Task<Void, Never>?

  init(
    source: GeofencingSource,
    onEvent: @escaping (GeofencingEvent) -> Void,
    onError: @escaping (Error) -> Void
  ) {
    self.source = source
    let updates = source.updates
    consumer = Task {
      do {
        for try await event in updates {
          onEvent(event)
        }
      } catch {
        onError(error)
      }
    }
  }

  var hasEnded: Bool {
    source.hasEnded
  }

  func setRegions(_ regions: [GeofencingRegion]) {
    source.setRegions(regions)
  }

  func stop() {
    consumer?.cancel()
    source.stop()
  }
}
