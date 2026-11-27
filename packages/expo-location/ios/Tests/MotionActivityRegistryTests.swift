import ExpoModulesCore
import Testing

@testable import ExpoLocation

private final class FakeWatch: MotionActivityWatch {
  let onActivity: ([String: Any]) -> Void
  private(set) var isStopped = false

  init(onActivity: @escaping ([String: Any]) -> Void) {
    self.onActivity = onActivity
  }

  func stop() {
    isStopped = true
  }
}

private final class FakeProvider: MotionActivityProvider {
  var isActivityAvailable = true
  var authorization = MotionActivityAuthorization.authorized
  private(set) var watches: [FakeWatch] = []

  func requestAuthorization(completion: @escaping () -> Void) {
    authorization = .authorized
    completion()
  }

  func watchActivity(
    onActivity: @escaping ([String: Any]) -> Void,
    onUnauthorized: @escaping () -> Void
  ) -> MotionActivityWatch {
    let watch = FakeWatch(onActivity: onActivity)
    watches.append(watch)
    return watch
  }
}

private final class FakeTask: NSObject, EXTaskInterface {
  let name = "test-task"
  let appId = "test-app-id"
  let appUrl = "test-app-url"
  var consumer: any EXTaskConsumerInterface
  var options: [AnyHashable: Any]?
  private(set) var invocations: [(data: [AnyHashable: Any]?, error: Error?)] = []

  init(consumer: any EXTaskConsumerInterface) {
    self.consumer = consumer
  }

  func execute(withData data: [AnyHashable: Any]?, withError error: Error?) {
    invocations.append((data, error))
  }
}

private func status(of requester: MotionActivityPermissionRequester) -> EXPermissionStatus.RawValue? {
  requester.getPermissions()["status"] as? EXPermissionStatus.RawValue
}

// The registry is process-wide state, so these tests must not run in parallel, and each test
// restores the provider it found.
@Suite("MotionActivityRegistry", .serialized)
final class MotionActivityRegistryTests {
  private let previousProvider = MotionActivityRegistry.provider

  deinit {
    MotionActivityRegistry.provider = previousProvider
  }

  @Test
  func `without the companion, motion activity throws that the companion is missing`() {
    MotionActivityRegistry.provider = nil

    #expect(throws: Exceptions.MotionActivityCompanionMissing.self) {
      try MotionActivityRegistry.authorizedProvider()
    }
  }

  @Test
  func `without the companion, the motion permission is denied`() {
    MotionActivityRegistry.provider = nil

    #expect(status(of: MotionActivityPermissionRequester()) == EXPermissionStatusDenied.rawValue)
  }

  @Test
  func `with the companion, the motion permission follows its authorization`() {
    let provider = FakeProvider()
    MotionActivityRegistry.provider = provider

    provider.authorization = .notDetermined
    #expect(status(of: MotionActivityPermissionRequester()) == EXPermissionStatusUndetermined.rawValue)
    provider.authorization = .authorized
    #expect(status(of: MotionActivityPermissionRequester()) == EXPermissionStatusGranted.rawValue)
    provider.authorization = .deniedOrRestricted
    #expect(status(of: MotionActivityPermissionRequester()) == EXPermissionStatusDenied.rawValue)
  }

  @Test(arguments: [
    (infoPlistValue: nil as Bool?, hasCompanion: false, warns: false),
    (infoPlistValue: false, hasCompanion: false, warns: false),
    (infoPlistValue: true, hasCompanion: false, warns: true),
    (infoPlistValue: true, hasCompanion: true, warns: false),
  ])
  func `warns about a missing companion only when Info.plist enables motion activity`(
    infoPlistValue: Bool?,
    hasCompanion: Bool,
    warns: Bool
  ) {
    MotionActivityRegistry.provider = hasCompanion ? FakeProvider() : nil

    #expect(MotionActivityRegistry.shouldWarnThatCompanionIsMissing(motionActivityEnabled: infoPlistValue) == warns)
  }

  @Test
  func `does not treat an Info.plist integer as enabling motion activity`() {
    MotionActivityRegistry.provider = nil

    #expect(MotionActivityRegistry.shouldWarnThatCompanionIsMissing(motionActivityEnabled: NSNumber(value: 1)) == false)
  }

  @Test
  func `without the companion, a restored task receives the companion-missing error`() {
    MotionActivityRegistry.provider = nil
    let consumer = MotionActivityTaskConsumer()
    let task = FakeTask(consumer: consumer)

    consumer.didRegisterTask(task)

    #expect(task.invocations.count == 1)
    #expect(task.invocations.first?.error is Exceptions.MotionActivityCompanionMissing)
  }

  @Test
  func `with the companion, the task receives each activity until it is unregistered`() throws {
    let provider = FakeProvider()
    MotionActivityRegistry.provider = provider
    let consumer = MotionActivityTaskConsumer()
    let task = FakeTask(consumer: consumer)

    consumer.didRegisterTask(task)
    let watch = try #require(provider.watches.first)
    watch.onActivity(["timestamp": 1])
    consumer.didUnregister()

    #expect(task.invocations.count == 1)
    #expect(task.invocations.first?.data?["activity"] as? [String: Int] == ["timestamp": 1])
    #expect(watch.isStopped)
  }
}
