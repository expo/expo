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

  init(value: VideoSourceLoaderListener? = nil) {
    self.value = value
  }

  static func == (lhs: WeakVideoSourceLoaderListener, rhs: WeakVideoSourceLoaderListener) -> Bool {
    guard let lhsValue = lhs.value, let rhsValue = rhs.value else {
      return lhs.value == nil && rhs.value == nil
    }
    return ObjectIdentifier(lhsValue) == ObjectIdentifier(rhsValue)
  }

  func hash(into hasher: inout Hasher) {
    if let value {
      hasher.combine(ObjectIdentifier(value))
    }
  }
}
