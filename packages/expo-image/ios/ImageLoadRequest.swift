import ExpoModulesCore

internal typealias ImageLoadCompletion = (
  _ source: ImageSource,
  _ image: UIImage?,
  _ finished: Bool,
  _ cacheType: ImageCacheType
) -> Void

internal enum ImageLoadState {
  case loading
  case completed
  case aborted
}

internal class ImageLoadRequest {
  let source: ImageSource
  let options: ImageLoadOptions

  weak var delegate: ImageLoadingDelegate?

  lazy var key: String? = source.getCacheKey()

  var state: ImageLoadState = .loading

  var result: UIImage?

  init(source: ImageSource, options: ImageLoadOptions, delegate: ImageLoadingDelegate? = nil) {
    self.source = source
    self.options = options
    self.delegate = delegate
  }

  internal func complete(image: UIImage, cacheType: ImageCacheType) {
    if state != .loading {
      return
    }
    result = image
    state = .completed

    Task {
      await delegate?.imageLoadCallback(self, source: source, image: image, finished: true, cacheType: cacheType)
    }
  }

  internal func partial(image: UIImage) {
    if state != .loading {
      return
    }
    Task {
      await delegate?.imageLoadCallback(self, source: source, image: image, finished: false, cacheType: .none)
    }
  }

  internal func abort() {
    if state == .loading {
      state = .aborted
    }
  }
}
