import CoreLocation
import ExpoModulesCore

final class GeofencingConsumer: NSObject, EXTaskConsumerInterface {
  private struct Subscription {
    let source: GeofencingSource
    let delivery: Task<Void, Never>

    func stop() {
      delivery.cancel()
      source.stop()
    }
  }

  var task: (any EXTaskInterface)?
  private var subscription: Subscription?

  func taskType() -> String {
    "geofencingNext"
  }

  func didRegisterTask(_ task: any EXTaskInterface) {
    self.task = task
    let options = GeofencingTaskOptions(name: task.name, dictionary: task.options)
    subscription = subscribe(task: task, options: options)
  }

  func setOptions(_ options: [AnyHashable: Any]) {
    guard let task else {
      return
    }
    let parsedOptions = GeofencingTaskOptions(name: task.name, dictionary: options)
    if let subscription, !subscription.source.hasEnded {
      subscription.source.setRegions(parsedOptions.regions)
      return
    }
    unsubscribe()
    subscription = subscribe(task: task, options: parsedOptions)
  }

  func didUnregister() {
    task = nil
    unsubscribe()
  }

  private func subscribe(task: any EXTaskInterface, options: GeofencingTaskOptions) -> Subscription {
    let source: GeofencingSource = if #available(iOS 17, *) {
      MonitorGeofencingSource(options: options)
    } else {
      CompatibilityGeofencingSource(options: options)
    }
    let delivery = Task { [weak task] in
      do {
        for try await event in source.updates {
          let data = event.toDictionary()
          task?.execute(withData: data, withError: nil)
        }
      } catch {
        task?.execute(withData: nil, withError: error)
      }
    }
    return Subscription(source: source, delivery: delivery)
  }

  private func unsubscribe() {
    subscription?.stop()
    subscription = nil
  }
}
