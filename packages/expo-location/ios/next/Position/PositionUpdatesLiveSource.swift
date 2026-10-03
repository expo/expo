import CoreLocation

@available(iOS 17.0, *)
final class PositionUpdatesLiveSource {
  func updates(for profile: Profile) -> PositionUpdatesSource {
    let (stream, continuation) = AsyncThrowingStream.makeStream(of: CLLocation?.self)
    let providerTask = Task {
      do {
        for try await update in CLLocationUpdate.liveUpdates(profile.clLocationUpdateProfile()) {
          guard !Task.isCancelled else {
            break
          }
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
    return PositionUpdatesSource(stream: stream, continuation: continuation) {
      providerTask.cancel()
    }
  }
}
