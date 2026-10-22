import CoreLocation

@available(iOS 17.0, *)
final class PositionUpdatesLiveSource {
  func updates(for profile: Profile, allowsBackgroundUpdates: Bool = false) -> PositionUpdatesSource {
    let (stream, continuation) = AsyncThrowingStream.makeStream(of: CLLocation?.self)
    let backgroundSession = allowsBackgroundUpdates ? CLBackgroundActivitySession() : nil
    let invalidateServiceSession = allowsBackgroundUpdates ? Self.holdAlwaysServiceSession() : {}
    let providerTask = Task {
      do {
        for try await update in CLLocationUpdate.liveUpdates(profile.clLocationUpdateProfile()) {
          guard !Task.isCancelled else {
            break
          }
          // Drop once iOS 17 support ends: from iOS 18 CLLocationUpdate reports this itself through authorizationDeniedGlobally.
          if #unavailable(iOS 18.0), !CLLocationManager.locationServicesEnabled() {
            continuation.finish(throwing: LocationServicesDisabledGlobally())
            return
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
      backgroundSession?.invalidate()
      invalidateServiceSession()
    }
  }

  private static func holdAlwaysServiceSession() -> () -> Void {
    guard #available(iOS 18.0, *) else {
      return {}
    }
    let session = CLServiceSession(authorization: .always)
    return {
      session.invalidate()
    }
  }
}
