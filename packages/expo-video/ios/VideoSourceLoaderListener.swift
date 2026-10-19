import Foundation

/**
 Callbacks are delivered asynchronously on the main queue, in the order the loader's state
 transitions happened. A terminal event (`onLoadingFinished`/`onLoadingCancelled`) may arrive
 after the corresponding `load()` call has already returned, but always before a player item
 replacement dispatched to the main queue afterwards.
 */
protocol VideoSourceLoaderListener: AnyObject {
  func onLoadingStarted(loader: VideoSourceLoader, videoSource: VideoSource?)
  func onLoadingFinished(loader: VideoSourceLoader, videoSource: VideoSource?, result: VideoPlayerItem?)
  func onLoadingCancelled(loader: VideoSourceLoader, videoSource: VideoSource?)
}

extension VideoSourceLoaderListener {
  func onLoadingStarted(loader: VideoSourceLoader, videoSource: VideoSource?) {}
  func onLoadingFinished(loader: VideoSourceLoader, videoSource: VideoSource?, result: VideoPlayerItem?) {}
  func onLoadingCancelled(loader: VideoSourceLoader, videoSource: VideoSource?) {}
}

final class WeakVideoSourceLoaderListener: Hashable {
  private(set) weak var value: VideoSourceLoaderListener?
  private let id: ObjectIdentifier

  init(value: VideoSourceLoaderListener) {
    self.value = value
    self.id = ObjectIdentifier(value)
  }

  static func == (lhs: WeakVideoSourceLoaderListener, rhs: WeakVideoSourceLoaderListener) -> Bool {
    return lhs.id == rhs.id
  }

  func hash(into hasher: inout Hasher) {
    hasher.combine(id)
  }
}
