import CoreLocation
import Testing

@testable import ExpoLocation

private final class FakeTask: NSObject, EXTaskInterface {
  struct Invocation {
    let data: [AnyHashable: Any]?
    let error: Error?
  }

  let name: String
  let appId: String
  let appUrl: String
  var consumer: any EXTaskConsumerInterface
  var options: [AnyHashable: Any]?

  private(set) var invocations: [Invocation] = []
  var onExecute: ((Invocation) -> Void)?

  init(
    consumer: any EXTaskConsumerInterface,
    options: [AnyHashable: Any]? = nil,
    name: String = "test-task",
    appId: String = "test-app-id",
    appUrl: String = "test-app-url"
  ) {
    self.consumer = consumer
    self.options = options
    self.name = name
    self.appId = appId
    self.appUrl = appUrl
  }

  func execute(withData data: [AnyHashable: Any]?, withError error: Error?) {
    let invocation = Invocation(data: data, error: error)
    invocations.append(invocation)
    onExecute?(invocation)
  }
}

@Suite("LocationUpdatesTaskConsumer")
struct LocationUpdatesTaskConsumerTests {
  private func register(_ task: FakeTask, on consumer: LocationUpdatesTaskConsumer) {
    let anyConsumer: any EXTaskConsumerInterface = consumer
    anyConsumer.didRegisterTask(task)
  }

  @Test
  func `taskType does not collide with the legacy consumer`() {
    let taskType = LocationUpdatesTaskConsumer().taskType()
    #expect(taskType == "locationNext")
  }

  @Test
  func `passes the computed configuration to the updates stream`() async {
    let source = FakeUpdatesSource()
    let consumer = LocationUpdatesTaskConsumer()
    consumer.makeStream = source.updates

    register(FakeTask(consumer: consumer, options: ["profile": "airborne"]), on: consumer)

    #expect(await source.nextProfile() == .airborne)
  }

  @Test
  func `executes the task when the stream yields a location`() async throws {
    let source = FakeUpdatesSource()
    let consumer = LocationUpdatesTaskConsumer()
    consumer.makeStream = source.updates
    let task = FakeTask(consumer: consumer)
    register(task, on: consumer)
    _ = await source.nextProfile()

    let invocation = await withCheckedContinuation { continuation in
      task.onExecute = { invocation in
        task.onExecute = nil
        continuation.resume(returning: invocation)
      }
      source.continuations.last?.yield(CLLocation(latitude: 52.2297, longitude: 21.0122))
    }

    #expect(invocation.error == nil)
    let coordinates = invocation.data?["coordinates"] as? [String: Any]
    #expect(coordinates?["latitude"] as? Double == 52.2297)
    #expect(coordinates?["longitude"] as? Double == 21.0122)
  }

  @Test
  func `does not execute the task when the stream yields no location`() async throws {
    let source = FakeUpdatesSource()
    let consumer = LocationUpdatesTaskConsumer()
    consumer.makeStream = source.updates
    let task = FakeTask(consumer: consumer)
    register(task, on: consumer)
    _ = await source.nextProfile()

    let firstInvocation = await withCheckedContinuation { continuation in
      task.onExecute = { invocation in
        task.onExecute = nil
        continuation.resume(returning: invocation)
      }
      source.continuations.last?.yield(nil)
      source.continuations.last?.yield(CLLocation(latitude: 1, longitude: 2))
    }

    #expect(firstInvocation.data != nil)
    #expect(firstInvocation.error == nil)
  }

  @Test
  func `forwards stream errors to the task`() async throws {
    let source = FakeUpdatesSource()
    let consumer = LocationUpdatesTaskConsumer()
    consumer.makeStream = source.updates
    let task = FakeTask(consumer: consumer)
    register(task, on: consumer)
    _ = await source.nextProfile()

    let invocation = await withCheckedContinuation { continuation in
      task.onExecute = { invocation in
        task.onExecute = nil
        continuation.resume(returning: invocation)
      }
      source.continuations.last?.finish(throwing: CLError(.denied))
    }

    #expect(invocation.data == nil)
    #expect(invocation.error != nil)
  }

  @Test
  func `didUnregister stops the source and deactivates the subscription`() async throws {
    let source = FakeUpdatesSource()
    let consumer = LocationUpdatesTaskConsumer()
    consumer.makeStream = source.updates
    register(FakeTask(consumer: consumer), on: consumer)
    _ = await source.nextProfile()

    consumer.didUnregister()

    await source.nextTermination()
    #expect(source.terminationCount == 1)
    #expect(consumer.subscription == nil)
  }
}
