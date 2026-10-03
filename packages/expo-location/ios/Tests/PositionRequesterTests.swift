import CoreLocation
import Testing

@testable import ExpoLocation

@Suite("PositionRequester")
struct PositionRequesterTests {
  @Test
  func `terminates the updates stream after returning the first location`() async throws {
    let requester = PositionRequester()
    requester.cachedLocation = { nil }

    let (terminations, terminationsContinuation) = AsyncStream.makeStream(of: Void.self)
    requester.liveUpdates = { _ in
      AsyncThrowingStream { continuation in
        continuation.onTermination = { _ in
          terminationsContinuation.yield()
        }
        continuation.yield(CLLocation(latitude: 1, longitude: 2))
      }
    }

    let location = try await requester.get(options: GetPositionOptions())
    #expect(location?.coordinate.latitude == 1)
    #expect(location?.coordinate.longitude == 2)

    var iterator = terminations.makeAsyncIterator()
    await iterator.next()
  }

  @Test
  func `returns the cached location when it satisfies the request`() async throws {
    let requester = PositionRequester()
    let cached = CLLocation(
      coordinate: CLLocationCoordinate2D(latitude: 3, longitude: 4),
      altitude: 0,
      horizontalAccuracy: 5,
      verticalAccuracy: 5,
      timestamp: Date()
    )
    requester.cachedLocation = { cached }
    requester.liveUpdates = { _ in
      Issue.record("live updates should not be started when the cache satisfies the request")
      return AsyncThrowingStream { $0.finish() }
    }

    let options = GetPositionOptions()
    options.maxCachedAge = 60

    let location = try await requester.get(options: options)
    #expect(location === cached)
  }

  @Test
  func `turns on the live updates when the cached location is too old`() async throws {
    let requester = PositionRequester()
    let cached = CLLocation(
      coordinate: CLLocationCoordinate2D(latitude: 3, longitude: 4),
      altitude: 0,
      horizontalAccuracy: 5,
      verticalAccuracy: 5,
      timestamp: Date(timeIntervalSinceNow: -120)
    )
    requester.cachedLocation = { cached }
    requester.liveUpdates = { _ in
      AsyncThrowingStream { continuation in
        continuation.yield(CLLocation(latitude: 1, longitude: 2))
        continuation.finish()
      }
    }

    let options = GetPositionOptions()
    options.maxCachedAge = 60

    let location = try await requester.get(options: options)
    #expect(location?.coordinate.latitude == 1)
    #expect(location?.coordinate.longitude == 2)
  }

  @Test
  func `returns nil when no location arrives in time and nothing is stored`() async throws {
    let requester = PositionRequester()
    requester.cachedLocation = { nil }
    requester.liveUpdates = { _ in
      AsyncThrowingStream { _ in }
    }
    let options = GetPositionOptions()
    options.timeout = 0.05

    let location = try await requester.get(options: options)

    #expect(location == nil)
  }

  @Test
  func `falls back to a stale stored position when no location arrives in time`() async throws {
    let requester = PositionRequester()
    let stale = CLLocation(
      coordinate: CLLocationCoordinate2D(latitude: 3, longitude: 4),
      altitude: 0,
      horizontalAccuracy: 5,
      verticalAccuracy: 5,
      timestamp: Date(timeIntervalSinceNow: -120)
    )
    requester.cachedLocation = { stale }
    requester.liveUpdates = { _ in
      AsyncThrowingStream { _ in }
    }
    let options = GetPositionOptions()
    options.timeout = 0.05
    options.maxCachedAge = 60

    let location = try await requester.get(options: options)

    #expect(location === stale)
  }

  @Test
  func `falls back to the stored position when the updates stream ends without a location`() async throws {
    let requester = PositionRequester()
    let stale = CLLocation(
      coordinate: CLLocationCoordinate2D(latitude: 3, longitude: 4),
      altitude: 0,
      horizontalAccuracy: 5,
      verticalAccuracy: 5,
      timestamp: Date(timeIntervalSinceNow: -120)
    )
    requester.cachedLocation = { stale }
    requester.liveUpdates = { _ in
      AsyncThrowingStream { continuation in
        continuation.yield(nil)
        continuation.finish()
      }
    }
    let options = GetPositionOptions()
    options.maxCachedAge = 60

    let location = try await requester.get(options: options)

    #expect(location === stale)
  }

  @Test
  func `returns the location when it arrives before the timeout`() async throws {
    let requester = PositionRequester()
    requester.cachedLocation = { nil }
    requester.liveUpdates = { _ in
      AsyncThrowingStream { continuation in
        continuation.yield(CLLocation(latitude: 52.2297, longitude: 21.0122))
        continuation.finish()
      }
    }
    let options = GetPositionOptions()
    options.timeout = 5

    let location = try await requester.get(options: options)

    #expect(location?.coordinate.latitude == 52.2297)
  }

  @Test
  func `a zero timeout returns the stored position without starting live updates`() async throws {
    let requester = PositionRequester()
    let cached = CLLocation(
      coordinate: CLLocationCoordinate2D(latitude: 1, longitude: 2),
      altitude: 0,
      horizontalAccuracy: 10,
      verticalAccuracy: 10,
      timestamp: Date()
    )
    requester.cachedLocation = { cached }
    requester.liveUpdates = { _ in
      Issue.record("live updates must not start when the timeout is zero")
      return AsyncThrowingStream { $0.finish() }
    }
    let options = GetPositionOptions()
    options.timeout = 0
    options.maxCachedAge = 60

    let location = try await requester.get(options: options)

    #expect(location?.coordinate.latitude == 1)
  }

  @Test
  func `a zero timeout returns nil when nothing is stored`() async throws {
    let requester = PositionRequester()
    requester.cachedLocation = { nil }
    requester.liveUpdates = { _ in
      Issue.record("live updates must not start when the timeout is zero")
      return AsyncThrowingStream { $0.finish() }
    }
    let options = GetPositionOptions()
    options.timeout = 0

    let location = try await requester.get(options: options)

    #expect(location == nil)
  }

  @Test
  func `a zero timeout returns a stored position older than maxCachedAge`() async throws {
    let requester = PositionRequester()
    let stale = CLLocation(
      coordinate: CLLocationCoordinate2D(latitude: 3, longitude: 4),
      altitude: 0,
      horizontalAccuracy: 5,
      verticalAccuracy: 5,
      timestamp: Date(timeIntervalSinceNow: -120)
    )
    requester.cachedLocation = { stale }
    requester.liveUpdates = { _ in
      Issue.record("live updates must not start when the timeout is zero")
      return AsyncThrowingStream { $0.finish() }
    }
    let options = GetPositionOptions()
    options.timeout = 0
    options.maxCachedAge = 60

    let location = try await requester.get(options: options)

    #expect(location === stale)
  }

  @Test
  func `returns a location even when the device could not measure its accuracy`() async throws {
    let requester = PositionRequester()
    requester.cachedLocation = { nil }
    requester.liveUpdates = { _ in
      AsyncThrowingStream { continuation in
        continuation.yield(Self.unmeasuredLocation)
        continuation.finish()
      }
    }

    let location = try await requester.get(options: GetPositionOptions())

    #expect(location?.coordinate.latitude == 9)
  }

  @Test
  func `reports an unmeasured accuracy as no accuracy at all`() {
    #expect(Self.unmeasuredLocation.toPosition().horizontalAccuracy == nil)
  }

  @Test
  func `reports a measured accuracy as it is`() {
    let position = CLLocation(
      coordinate: CLLocationCoordinate2D(latitude: 1, longitude: 2),
      altitude: 0,
      horizontalAccuracy: 12.5,
      verticalAccuracy: 10,
      timestamp: Date()
    ).toPosition()

    #expect(position.horizontalAccuracy == 12.5)
  }

  private static let unmeasuredLocation = CLLocation(
    coordinate: CLLocationCoordinate2D(latitude: 9, longitude: 9),
    altitude: 0,
    horizontalAccuracy: -1,
    verticalAccuracy: -1,
    timestamp: Date()
  )
}
