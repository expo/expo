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

  private func receivedProfile(options: [AnyHashable: Any]?) async -> Profile {
    let consumer = LocationUpdatesTaskConsumer()
    return await withCheckedContinuation { continuation in
      consumer.streamer.liveUpdates = { profile in
        continuation.resume(returning: profile)
        return AsyncThrowingStream { $0.finish() }
      }
      register(FakeTask(consumer: consumer, options: options), on: consumer)
    }
  }

  @Test
  func `taskType does not collide with the legacy consumer`() {
    let taskType = LocationUpdatesTaskConsumer().taskType()
    #expect(taskType == "locationNext")
  }

  @Test
  func `passes the computed configuration to the updates stream`() async {
    let received = await receivedProfile(options: ["profile": "airborne"])
    #expect(received == .airborne)
  }

  @Test
  func `executes the task when the stream yields a location`() async throws {
    let consumer = LocationUpdatesTaskConsumer()
    consumer.streamer.liveUpdates = { _ in
      AsyncThrowingStream { continuation in
        continuation.yield(CLLocation(latitude: 52.2297, longitude: 21.0122))
        continuation.finish()
      }
    }
    let task = FakeTask(consumer: consumer)
    let invocation = await withCheckedContinuation { continuation in
      task.onExecute = { invocation in
        task.onExecute = nil
        continuation.resume(returning: invocation)
      }
      register(task, on: consumer)
    }
    #expect(invocation.error == nil)
    let coordinates = invocation.data?["coordinates"] as? [String: Any]
    #expect(coordinates?["latitude"] as? Double == 52.2297)
    #expect(coordinates?["longitude"] as? Double == 21.0122)
  }

  @Test
  func `does not execute the task when the stream yields no location`() async throws {
    let consumer = LocationUpdatesTaskConsumer()
    consumer.streamer.liveUpdates = { _ in
      AsyncThrowingStream { continuation in
        continuation.yield(nil)
        continuation.yield(CLLocation(latitude: 1, longitude: 2))
        continuation.finish()
      }
    }
    let task = FakeTask(consumer: consumer)
    let firstInvocation = await withCheckedContinuation { continuation in
      task.onExecute = { invocation in
        task.onExecute = nil
        continuation.resume(returning: invocation)
      }
      register(task, on: consumer)
    }
    #expect(firstInvocation.data != nil)
    #expect(firstInvocation.error == nil)
  }

  @Test
  func `forwards stream errors to the task`() async throws {
    let consumer = LocationUpdatesTaskConsumer()
    consumer.streamer.liveUpdates = { _ in
      AsyncThrowingStream { $0.finish(throwing: CLError(.denied)) }
    }
    let task = FakeTask(consumer: consumer)
    let invocation = await withCheckedContinuation { continuation in
      task.onExecute = { invocation in
        task.onExecute = nil
        continuation.resume(returning: invocation)
      }
      register(task, on: consumer)
    }
    #expect(invocation.data == nil)
    #expect(invocation.error != nil)
  }

  @Test
  func `didUnregister cancels the updates task and terminates the stream`() async throws {
    let consumer = LocationUpdatesTaskConsumer()
    let terminated = await withCheckedContinuation { (started: CheckedContinuation<Task<Void, Never>, Never>) in
      consumer.streamer.liveUpdates = { _ in
        AsyncThrowingStream { continuation in
          let awaitTermination = Task {
            await withCheckedContinuation { (termination: CheckedContinuation<Void, Never>) in
              continuation.onTermination = { _ in
                termination.resume()
              }
            }
          }
          started.resume(returning: awaitTermination)
        }
      }
      register(FakeTask(consumer: consumer), on: consumer)
    }
    consumer.didUnregister()
    await terminated.value
    #expect(consumer.streamer.streamingTask?.isCancelled == true)
  }
}
