import CoreLocation
import ExpoModulesCore

final class PositionRequester {
  var liveUpdates: (_ profile: Profile) -> AsyncThrowingStream<CLLocation?, Error> = PositionUpdatesSourceSelector.updates
  var cachedLocation: () async -> CLLocation? = {
    await MainActor.run { CLLocationManager().location }
  }

  func get(options: GetPositionOptions) async throws -> CLLocation? {
    guard options.timeout >= 0 else {
      throw InvalidLocationTimeoutException()
    }
    guard options.maxCachedAge >= 0 else {
      throw InvalidMaxCachedAgeException()
    }
    let requestedAt = Date()
    if let cached = await cachedLocation(), isRecentEnough(cached, asOf: requestedAt, options: options) {
      return cached
    }
    guard options.timeout > 0 else {
      return await cachedLocation()
    }
    return try await withThrowingTaskGroup(of: CLLocation?.self) { group in
      group.addTask {
        try await self.firstLocation(options: options, requestedAt: requestedAt)
      }
      if options.timeout != .infinity {
        group.addTask {
          try await Task.sleep(for: .seconds(options.timeout))
          return nil
        }
      }
      let location = try await group.next() ?? nil
      group.cancelAll()
      if let location {
        return location
      }
      return await cachedLocation()
    }
  }

  private func firstLocation(options: GetPositionOptions, requestedAt: Date) async throws -> CLLocation? {
    for try await location in liveUpdates(options.profile) {
      if let location, isRecentEnough(location, asOf: requestedAt, options: options) {
        return location
      }
    }
    return nil
  }

  private func isRecentEnough(_ location: CLLocation, asOf reference: Date, options: GetPositionOptions) -> Bool {
    reference.timeIntervalSince(location.timestamp) <= options.maxCachedAge
  }
}
