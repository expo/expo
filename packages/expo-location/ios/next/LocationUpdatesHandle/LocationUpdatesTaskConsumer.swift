import ExpoModulesCore
import CoreLocation

final class LocationUpdatesTaskConsumer: NSObject, EXTaskConsumerInterface {
  var task: (any EXTaskInterface)?
  let streamer = LocationUpdatesStreamer()

  func didRegisterTask(_ task: any EXTaskInterface) {
    let options = LocationUpdatesTaskOptions(task.options)
    streamer.start(
      profile: options.profile,
      onLocation: { location in
        task.execute(withData: location.toPosition().toEventPayload(), withError: nil)
      },
      onError: { error in
        task.execute(withData: nil, withError: error)
      }
    )
  }

  func taskType() -> String {
    return "locationNext"
  }

  func didUnregister() {
    streamer.stop()
  }
}
