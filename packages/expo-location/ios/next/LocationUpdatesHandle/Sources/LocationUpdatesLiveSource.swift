import CoreLocation

@available(iOS 17.0, *)
final class LocationUpdatesLiveSource {
  func updates(for profile: Profile) -> AsyncThrowingStream<CLLocation?, Error> {
    AsyncThrowingStream { continuation in
      let providerTask = Task {
        do {
          for try await update in CLLocationUpdate.liveUpdates(profile.clLocationUpdateProfile()) {
            if #available(iOS 18.0, *), let failure = LocationUpdateDiagnostics(update).unrecoverableFailure() {
              continuation.finish(throwing: failure)
              return
            }
            continuation.yield(update.location)
          }
          if Task.isCancelled {
            continuation.finish()
          } else {
            continuation.finish(throwing: LocationUpdatesEndedUnexpectedly())
          }
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
