import ExpoModulesCore
import Foundation
import Testing

@testable import ExpoTaskManager

@Suite("EXTaskService")
struct EXTaskServiceTests {
  @Test
  func `exposes a shared singleton`() {
    #expect(EXTaskService.shared != nil)
  }

  // `executeTask` reads `UIApplication.applicationState`, which has to happen on the main thread.
  @MainActor
  @Test
  func `returns the ID of the event it started and tells the consumer how that event finished`() throws {
    let appId = "EXTaskServiceTests-\(UUID().uuidString)"
    let service = EXTaskService.shared
    let taskManager = RecordingTaskManager()
    service.setTaskManager(taskManager, forAppId: appId, withUrl: nil)
    defer {
      service.unregisterAllTasks(forAppId: appId)
    }

    service.registerTask(
      withName: "task",
      appId: appId,
      appUrl: nil,
      consumerClass: RecordingConsumer.self,
      options: nil
    )
    let consumer = try #require(RecordingConsumer.registered.withLock { $0[appId] })
    let task = try #require(consumer.task)
    let eventId = service.executeTask(task, withData: ["value": 1], withError: nil)

    let body = try #require(taskManager.bodies.first)
    let executionInfo = try #require(body["executionInfo"] as? [String: Any])
    #expect(executionInfo["eventId"] as? String == eventId)

    service.notifyTask(
      withName: "task",
      forAppId: appId,
      didFinishWithResponse: ["eventId": eventId, "result": "done"]
    )

    let response = try #require(consumer.finishedResponses.first)
    #expect(response["eventId"] as? String == eventId)
    #expect(response["result"] as? String == "done")
  }

  @Test
  func `get-or-register returns a task of another type unchanged and registers only a free name`() throws {
    let appId = "EXTaskServiceTests-\(UUID().uuidString)"
    let service = EXTaskService.shared
    defer {
      service.unregisterAllTasks(forAppId: appId)
    }
    service.registerTask(
      withName: "taken",
      appId: appId,
      appUrl: nil,
      consumerClass: RecordingConsumer.self,
      options: nil
    )
    let owner = try #require(RecordingConsumer.registered.withLock { $0[appId] })

    let existing = service.getOrRegisterTask(
      withName: "taken",
      appId: appId,
      appUrl: nil,
      consumerClass: OtherConsumer.self,
      options: nil
    )
    let registered = service.getOrRegisterTask(
      withName: "free",
      appId: appId,
      appUrl: nil,
      consumerClass: OtherConsumer.self,
      options: nil
    )

    #expect(existing.consumer === owner)
    #expect(owner.unregisterCount == 0)
    let newConsumer = try #require(registered.consumer as? OtherConsumer)
    #expect(newConsumer.task?.name == "free")
  }

  @Test
  func `lists a task that was registered without options`() {
    let appId = "EXTaskServiceTests-\(UUID().uuidString)"
    let service = EXTaskService.shared
    defer {
      service.unregisterAllTasks(forAppId: appId)
    }

    service.registerTask(
      withName: "task",
      appId: appId,
      appUrl: nil,
      consumerClass: RecordingConsumer.self,
      options: nil
    )
    let tasks = service.getRegisteredTasks(forAppId: appId) as? [[String: Any]]

    #expect(tasks?.count == 1)
    #expect(tasks?.first?["taskName"] as? String == "task")
  }

  @Test
  func `unregisters the previous consumer when a consumer of another type takes over the task`() throws {
    let appId = "EXTaskServiceTests-\(UUID().uuidString)"
    let service = EXTaskService.shared
    defer {
      service.unregisterAllTasks(forAppId: appId)
    }

    service.registerTask(
      withName: "task",
      appId: appId,
      appUrl: nil,
      consumerClass: RecordingConsumer.self,
      options: nil
    )
    let consumer = try #require(RecordingConsumer.registered.withLock { $0[appId] })
    service.registerTask(
      withName: "task",
      appId: appId,
      appUrl: nil,
      consumerClass: OtherConsumer.self,
      options: nil
    )

    #expect(consumer.unregisterCount == 1)
    #expect(service.task(withName: "task", forAppId: appId, hasConsumerOf: OtherConsumer.self))
  }
}

private final class OtherConsumer: NSObject, EXTaskConsumerInterface {
  var task: EXTaskInterface?

  func taskType() -> String {
    return "other"
  }

  func didRegisterTask(_ task: EXTaskInterface) {
    self.task = task
  }
}

private final class RecordingConsumer: NSObject, EXTaskResponseConsumer {
  /// The service creates consumers itself, so this is how a test gets hold of the one it registered.
  static let registered = Mutex<[String: RecordingConsumer]>([:])

  var task: EXTaskInterface?
  private(set) var finishedResponses: [[AnyHashable: Any]] = []

  func taskType() -> String {
    return "recording"
  }

  func didRegisterTask(_ task: EXTaskInterface) {
    self.task = task
    Self.registered.withLock { $0[task.appId] = self }
  }

  private(set) var unregisterCount = 0

  func didUnregister() {
    unregisterCount += 1
  }

  func didFinishEvent(withResponse response: [AnyHashable: Any]) {
    finishedResponses.append(response)
  }
}

private final class RecordingTaskManager: NSObject, EXTaskManagerInterface {
  private(set) var bodies: [[String: Any]] = []

  func hasRegisteredTask(withName taskName: String) -> Bool {
    return false
  }

  func task(withName taskName: String, hasConsumerOf consumerClass: AnyClass) -> Bool {
    return false
  }

  func registerTask(withName taskName: String, consumer consumerClass: AnyClass, options: [AnyHashable: Any]) {}

  func unregisterTask(withName taskName: String, consumerClass: AnyClass?) {}

  func hasBackgroundModeEnabled(_ backgroundMode: String) -> Bool {
    return false
  }

  func execute(withBody body: [String: Any]) {
    bodies.append(body)
  }

  func isRunningInHeadlessMode() -> Bool {
    return false
  }
}
