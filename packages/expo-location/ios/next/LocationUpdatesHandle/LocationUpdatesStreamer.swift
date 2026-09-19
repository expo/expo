import CoreLocation

final class LocationUpdatesStreamer {
  private(set) var streamingTask: Task<Void, Never>?

  var liveUpdates: (_ profile: Profile) -> AsyncThrowingStream<CLLocation?, Error> = LocationUpdatesSourceSelector.updates

  func start(
    profile: Profile,
    onLocation: @escaping (CLLocation) -> Void,
    onError: @escaping (Error) -> Void
  ) {
    stop()
    streamingTask = Task { @MainActor in
      do {
        for try await location in liveUpdates(profile) {
          if let location {
            onLocation(location)
          }
        }
      } catch {
        onError(error)
      }
    }
  }

  func stop() {
    streamingTask?.cancel()
  }

  deinit {
    stop()
  }
}
