import CoreLocation

@available(iOS 17.0, *)
final class PositionUpdatesLiveSource {
  func updates(for profile: Profile) -> AsyncThrowingStream<CLLocation?, Error> {
    AsyncThrowingStream { continuation in
      let providerTask = Task {
        do {
          for try await update in CLLocationUpdate.liveUpdates(profile.clLocationUpdateProfile()) {
            continuation.yield(update.location)
          }
          continuation.finish()
        } catch {
          continuation.finish(throwing: error)
        }
      }
      continuation.onTermination = { _ in
        providerTask.cancel()
      }
    }
  }
}
