import CoreLocation
import Testing

@testable import ExpoLocation

@Suite("PositionWatcher")
struct PositionWatcherTests {
  @Test
  func `start opens the stream with the given profile`() async throws {
    let source = FakeUpdatesSource()
    let watcher = PositionWatcher(profile: .automotiveNavigation)
    watcher.liveUpdates = source.updates

    watcher.start()

    let status = watcher.status()
    #expect(status.isSubscribed)
    #expect(status.isStarted)
    #expect(!status.isPaused)
    #expect(await source.nextProfile() == .automotiveNavigation)
  }

  @Test
  func `pause terminates the stream`() async throws {
    let source = FakeUpdatesSource()
    let watcher = PositionWatcher(profile: .default)
    watcher.liveUpdates = source.updates
    watcher.start()
    _ = await source.nextProfile()

    watcher.pause()

    await source.nextTermination()
    let status = watcher.status()
    #expect(!status.isSubscribed)
    #expect(status.isPaused)
    #expect(status.isHandleAlive)
  }

  @Test
  func `resume after pause opens a new stream and returns true`() async throws {
    let source = FakeUpdatesSource()
    let watcher = PositionWatcher(profile: .default)
    watcher.liveUpdates = source.updates
    watcher.start()
    _ = await source.nextProfile()
    watcher.pause()
    await source.nextTermination()

    let resumed = watcher.resume()

    #expect(resumed)
    #expect(await source.nextProfile() == .default)
    #expect(watcher.status().isSubscribed)
  }

  @Test
  func `resume before start returns false and opens nothing`() async throws {
    let source = FakeUpdatesSource()
    let watcher = PositionWatcher(profile: .default)
    watcher.liveUpdates = source.updates

    let resumed = watcher.resume()

    #expect(!resumed)
    #expect(!watcher.status().isSubscribed)
    try await Task.sleep(for: .milliseconds(50))
    #expect(source.openCount == 0)
  }

  @Test
  func `restart with nothing staged keeps the stream and returns true`() async throws {
    let source = FakeUpdatesSource()
    let watcher = PositionWatcher(profile: .default)
    watcher.liveUpdates = source.updates
    watcher.start()
    _ = await source.nextProfile()

    let restarted = watcher.restart()

    #expect(restarted)
    try await Task.sleep(for: .milliseconds(50))
    #expect(source.openCount == 1)
    #expect(source.terminationCount == 0)
  }

  @Test
  func `restart after withProfile swaps the stream`() async throws {
    let source = FakeUpdatesSource()
    let watcher = PositionWatcher(profile: .default)
    watcher.liveUpdates = source.updates
    watcher.start()
    _ = await source.nextProfile()

    watcher.withProfile(.fitness)
    let restarted = watcher.restart()

    #expect(restarted)
    await source.nextTermination()
    #expect(await source.nextProfile() == .fitness)
    #expect(watcher.status().isSubscribed)
  }

  @Test
  func `restart after withInterval alone swaps the stream`() async throws {
    let source = FakeUpdatesSource()
    let watcher = PositionWatcher(profile: .default)
    watcher.liveUpdates = source.updates
    watcher.start()
    _ = await source.nextProfile()

    watcher.withInterval(2)
    let restarted = watcher.restart()

    #expect(restarted)
    await source.nextTermination()
    #expect(await source.nextProfile() == .default)
    #expect(source.openCount == 2)
  }

  @Test
  func `withProfile without restart changes nothing`() async throws {
    let source = FakeUpdatesSource()
    let watcher = PositionWatcher(profile: .default)
    watcher.liveUpdates = source.updates
    watcher.start()
    _ = await source.nextProfile()

    watcher.withProfile(.fitness)

    try await Task.sleep(for: .milliseconds(50))
    #expect(source.openCount == 1)
    #expect(source.terminationCount == 0)
  }

  @Test
  func `release terminates the stream and cannot be resumed`() async throws {
    let source = FakeUpdatesSource()
    let watcher = PositionWatcher(profile: .default)
    watcher.liveUpdates = source.updates
    watcher.start()
    _ = await source.nextProfile()

    watcher.sharedObjectWillRelease()

    await source.nextTermination()
    #expect(!watcher.status().isHandleAlive)
    #expect(!watcher.resume())
    try await Task.sleep(for: .milliseconds(50))
    #expect(source.openCount == 1)
  }

  @Test
  func `a stream that finishes on its own clears isSubscribed and is not reopened`() async throws {
    let source = FakeUpdatesSource()
    let watcher = PositionWatcher(profile: .default)
    watcher.liveUpdates = source.updates
    watcher.start()
    _ = await source.nextProfile()

    source.continuations.last?.finish()

    await waitUntil { !watcher.status().isSubscribed }
    #expect(watcher.status().isStarted)
    try await Task.sleep(for: .milliseconds(50))
    #expect(source.openCount == 1)
  }

  @Test
  func `a stale stream ending after a restart does not clear the new one`() async throws {
    let source = FakeUpdatesSource()
    let watcher = PositionWatcher(profile: .default)
    watcher.liveUpdates = source.updates
    watcher.start()
    _ = await source.nextProfile()

    watcher.withProfile(.fitness)
    _ = watcher.restart()
    await source.nextTermination()
    _ = await source.nextProfile()

    try await Task.sleep(for: .milliseconds(50))
    #expect(watcher.status().isSubscribed)
    #expect(source.openCount == 2)
  }

  @Test
  func `nil locations are skipped`() async throws {
    let source = FakeUpdatesSource()
    let watcher = PositionWatcher(profile: .default)
    watcher.liveUpdates = source.updates
    let payloads = PayloadRecorder()
    watcher.send = payloads.record
    watcher.start()
    _ = await source.nextProfile()

    source.continuations.last?.yield(nil)
    source.continuations.last?.yield(Self.location(latitude: 1, secondsAgo: 0))
    source.continuations.last?.finish()

    let sent = await payloads.collect(after: { await waitUntil { !watcher.status().isSubscribed } })
    #expect(sent.count == 1)
    let data = try #require(sent.first?["data"] as? [String: Any])
    let coordinates = try #require(data["coordinates"] as? [String: Any])
    #expect(coordinates["latitude"] as? Double == 1)
  }

  @Test
  func `two locations closer than the interval send one payload`() async throws {
    let source = FakeUpdatesSource()
    let watcher = PositionWatcher(profile: .default)
    watcher.liveUpdates = source.updates
    let payloads = PayloadRecorder()
    watcher.send = payloads.record
    watcher.withInterval(1)
    _ = watcher.restart()
    watcher.start()
    _ = await source.nextProfile()

    source.continuations.last?.yield(Self.location(latitude: 1, secondsAgo: 0.2))
    source.continuations.last?.yield(Self.location(latitude: 2, secondsAgo: 0))
    source.continuations.last?.finish()

    let sent = await payloads.collect(after: { await waitUntil { !watcher.status().isSubscribed } })
    #expect(sent.count == 1)
  }

  @Test
  func `two locations further apart than the interval send two payloads`() async throws {
    let source = FakeUpdatesSource()
    let watcher = PositionWatcher(profile: .default)
    watcher.liveUpdates = source.updates
    let payloads = PayloadRecorder()
    watcher.send = payloads.record
    watcher.withInterval(1)
    _ = watcher.restart()
    watcher.start()
    _ = await source.nextProfile()

    source.continuations.last?.yield(Self.location(latitude: 1, secondsAgo: 2))
    source.continuations.last?.yield(Self.location(latitude: 2, secondsAgo: 0))
    source.continuations.last?.finish()

    let sent = await payloads.collect(after: { await waitUntil { !watcher.status().isSubscribed } })
    #expect(sent.count == 2)
  }

  @Test
  func `a throwing stream sends an error payload and clears isSubscribed`() async throws {
    let source = FakeUpdatesSource()
    let watcher = PositionWatcher(profile: .default)
    watcher.liveUpdates = source.updates
    let payloads = PayloadRecorder()
    watcher.send = payloads.record
    watcher.start()
    _ = await source.nextProfile()

    source.continuations.last?.finish(throwing: LocationServicesDisabledGlobally())

    let sent = await payloads.collect(after: { await waitUntil { !watcher.status().isSubscribed } })
    #expect(sent.count == 1)
    #expect(sent.first?["error"] as? String == LocationServicesDisabledGlobally().code)
    #expect(sent.first?["data"] == nil)
  }

  @Test
  func `status mirrors the app foreground flag`() {
    let watcher = PositionWatcher(profile: .default)
    let previous = PositionWatcher.isAppInForeground
    defer { PositionWatcher.isAppInForeground = previous }

    PositionWatcher.isAppInForeground = false
    #expect(!watcher.status().isInForeground)
    PositionWatcher.isAppInForeground = true
    #expect(watcher.status().isInForeground)
  }

  @Test
  func `an update carries the position the device reported`() throws {
    let location = CLLocation(latitude: 52.2297, longitude: 21.0122)

    let payload = PositionWatcher.positionPayload(location)

    let data = try #require(payload["data"] as? [String: Any])
    let coordinates = try #require(data["coordinates"] as? [String: Any])
    #expect(coordinates["latitude"] as? Double == 52.2297)
    #expect(coordinates["longitude"] as? Double == 21.0122)
    #expect(data["timestamp"] as? Double != nil)
    #expect(payload["error"] == nil)
  }

  @Test
  func `a known failure carries the code the app can branch on`() {
    let payload = PositionWatcher.errorPayload(LocationServicesDisabledGlobally())

    #expect(payload["error"] as? String == LocationServicesDisabledGlobally().code)
    #expect(payload["data"] == nil)
  }

  @Test
  func `an unknown failure carries its description`() {
    let payload = PositionWatcher.errorPayload(CLError(.network))

    #expect((payload["error"] as? String)?.isEmpty == false)
    #expect(payload["data"] == nil)
  }

  private static func location(latitude: Double, secondsAgo: TimeInterval) -> CLLocation {
    return CLLocation(
      coordinate: CLLocationCoordinate2D(latitude: latitude, longitude: 21),
      altitude: 0,
      horizontalAccuracy: 5,
      verticalAccuracy: 5,
      timestamp: Date(timeIntervalSinceNow: -secondsAgo)
    )
  }
}

private func waitUntil(timeout: Duration = .seconds(2), _ condition: () -> Bool) async {
  let deadline = ContinuousClock.now + timeout
  while !condition() && ContinuousClock.now < deadline {
    try? await Task.sleep(for: .milliseconds(10))
  }
}

private final class FakeUpdatesSource: @unchecked Sendable {
  private(set) var openCount = 0
  private(set) var terminationCount = 0
  private(set) var continuations: [AsyncThrowingStream<CLLocation?, Error>.Continuation] = []
  private let profiles: AsyncStream<Profile>
  private let profilesContinuation: AsyncStream<Profile>.Continuation
  private let terminations: AsyncStream<Void>
  private let terminationsContinuation: AsyncStream<Void>.Continuation
  private lazy var profilesIterator = profiles.makeAsyncIterator()
  private lazy var terminationsIterator = terminations.makeAsyncIterator()

  init() {
    (profiles, profilesContinuation) = AsyncStream.makeStream(of: Profile.self)
    (terminations, terminationsContinuation) = AsyncStream.makeStream(of: Void.self)
  }

  func updates(for profile: Profile) -> AsyncThrowingStream<CLLocation?, Error> {
    openCount += 1
    profilesContinuation.yield(profile)
    return AsyncThrowingStream { continuation in
      continuations.append(continuation)
      continuation.onTermination = { [self] _ in
        terminationCount += 1
        terminationsContinuation.yield()
      }
    }
  }

  func nextProfile() async -> Profile? {
    return await profilesIterator.next()
  }

  func nextTermination() async {
    _ = await terminationsIterator.next()
  }
}

private final class PayloadRecorder: @unchecked Sendable {
  private let payloads: AsyncStream<[String: Any]>
  private let continuation: AsyncStream<[String: Any]>.Continuation

  init() {
    (payloads, continuation) = AsyncStream.makeStream(of: [String: Any].self)
  }

  func record(_ payload: [String: Any]) {
    continuation.yield(payload)
  }

  func collect(after streamHasEnded: () async -> Void) async -> [[String: Any]] {
    await streamHasEnded()
    continuation.finish()
    var collected: [[String: Any]] = []
    for await payload in payloads {
      collected.append(payload)
    }
    return collected
  }
}
