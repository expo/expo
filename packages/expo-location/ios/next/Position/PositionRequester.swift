import CoreLocation
import ExpoModulesCore

class PositionRequester {
  var liveUpdates: (_ profile: Profile) -> AsyncThrowingStream<CLLocation?, Error> = PositionUpdatesSourceSelector.updates
  var cachedLocation: () async -> CLLocation? = {
    await MainActor.run { CLLocationManager().location }
  }

  func get(options: GetPositionOptions) async throws -> CLLocation? {
    if let cached = await cachedLocation(), isAcceptable(cached, options: options) {
      return cached
    }
    guard options.timeout > 0 else {
      return await cachedLocation()
    }
    return try await withThrowingTaskGroup(of: CLLocation?.self) { group in
      group.addTask {
        try await self.firstLocation(options: options)
      }
      group.addTask {
        try await Task.sleep(for: .seconds(options.timeout))
        return nil
      }
      let location = try await group.next() ?? nil
      group.cancelAll()
      if let location {
        return location
      }
      return await cachedLocation()
    }
  }

  private func firstLocation(options: GetPositionOptions) async throws -> CLLocation? {
    for try await location in liveUpdates(options.profile) {
      if let location {
        return location
      }
    }
    return nil
  }

  private func isAcceptable(_ location: CLLocation, options: GetPositionOptions) -> Bool {
    let age = -location.timestamp.timeIntervalSinceNow
    return age <= options.maxCachedAge
  }
}
