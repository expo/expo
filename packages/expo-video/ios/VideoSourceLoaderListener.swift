import Foundation

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
