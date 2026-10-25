import CoreLocation

@testable import ExpoLocation

final class FakeUpdatesSource: @unchecked Sendable {
  private(set) var openCount = 0
  private(set) var terminationCount = 0
  private(set) var stopCount = 0
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

  func updates(for profile: Profile) -> PositionUpdatesSource {
    openCount += 1
    let (stream, continuation) = AsyncThrowingStream.makeStream(of: CLLocation?.self)
    continuations.append(continuation)
    let source = PositionUpdatesSource(stream: stream, continuation: continuation) { [self] in
      stopCount += 1
      terminationCount += 1
      terminationsContinuation.yield()
    }
    profilesContinuation.yield(profile)
    return source
  }

  func nextProfile() async -> Profile? {
    return await profilesIterator.next()
  }

  func nextTermination() async {
    _ = await terminationsIterator.next()
  }
}
