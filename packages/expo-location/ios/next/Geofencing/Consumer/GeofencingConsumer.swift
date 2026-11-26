import CoreLocation
import ExpoModulesCore

final class GeofencingConsumer: NSObject, EXTaskConsumerInterface {
  var task: (any EXTaskInterface)?
  private var subscription: GeofencingSubscription?

  func taskType() -> String {
    "geofencingNext"
  }

  func didRegisterTask(_ task: any EXTaskInterface) {
    self.task = task
    let options = GeofencingTaskOptions(name: task.name, dictionary: task.options)
    subscription = makeSubscription(task: task, options: options)
  }

  func setOptions(_ options: [AnyHashable: Any]) {
    guard let task else {
      return
    }
    let parsedOptions = GeofencingTaskOptions(name: task.name, dictionary: options)
    if let subscription, !subscription.hasEnded {
      subscription.setRegions(parsedOptions.regions)
      return
    }
    subscription?.stop()
    subscription = makeSubscription(task: task, options: parsedOptions)
  }

  func didUnregister() {
    task = nil
    subscription?.stop()
    subscription = nil
  }

  private func makeSubscription(task: any EXTaskInterface, options: GeofencingTaskOptions) -> GeofencingSubscription {
    let source = pickSource(options: options)
    return GeofencingSubscription(
      source: source,
      onEvent: { [weak task] event in
        let data = event.toDictionary()
        task?.execute(withData: data, withError: nil)
      },
      onError: { [weak task] error in
        task?.execute(withData: nil, withError: error)
      }
    )
  }

  private func pickSource(options: GeofencingTaskOptions) -> GeofencingSource {
    return if #available(iOS 17, *) {
      MonitorGeofencingSource(options: options)
    } else {
      CompatibilityGeofencingSource(options: options)
    }
  }
}
