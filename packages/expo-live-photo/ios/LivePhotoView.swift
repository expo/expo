// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore
import PhotosUI

class LivePhotoView: ExpoView, PHLivePhotoViewDelegate {
  let livePhotoView: PHLivePhotoView
  var gestureRecognizer: UIGestureRecognizer

  private let onLoadStart = EventDispatcher()
  private let onPreviewPhotoLoad = EventDispatcher()
  private let onLoadComplete = EventDispatcher()
  private let onLoadError = EventDispatcher()
  private let onPlaybackStart = EventDispatcher()
  private let onPlaybackStop = EventDispatcher()

  var source: LivePhotoAsset? {
    didSet {
      Task {
        await loadLivePhoto()
      }
    }
  }

  var contentFit: ContentFit = .contain {
    didSet {
      Task {
        await loadLivePhoto()
      }
    }
  }

  var useDefaultGestureRecognizer: Bool = true {
    didSet {
      if !useDefaultGestureRecognizer {
        gestureRecognizer = livePhotoView.playbackGestureRecognizer
        livePhotoView.removeGestureRecognizer(livePhotoView.playbackGestureRecognizer)
      } else {
        livePhotoView.addGestureRecognizer(gestureRecognizer)
      }
    }
  }

  required init(appContext: AppContext? = nil) {
    livePhotoView = PHLivePhotoView()
    gestureRecognizer = livePhotoView.playbackGestureRecognizer

    super.init(appContext: appContext)
    livePhotoView.delegate = self

    livePhotoView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    livePhotoView.backgroundColor = self.backgroundColor ?? .clear

    self.addSubview(livePhotoView)
  }

  private func loadLivePhoto() async {
    guard let source else {
      livePhotoView.livePhoto = nil
      return
    }

    do {
      onLoadStart()
      let livePhotoStream = try source.toLivePhotoStream(targetSize: self.frame.size, contentFit: contentFit)

      for try await (isLowQuality, livePhoto) in livePhotoStream {
        if isLowQuality {
          onPreviewPhotoLoad()
        }
        livePhotoView.livePhoto = livePhoto
      }
      onLoadComplete()
    } catch {
      onLoadError(LivePhotoLoadError(message: "\(error)").toDictionary())
    }
  }

  // MARK: - PHLivePhotoViewDelegate

  func livePhotoView(_ livePhotoView: PHLivePhotoView, willBeginPlaybackWith playbackStyle: PHLivePhotoViewPlaybackStyle) {
    onPlaybackStart()
  }

  func livePhotoView(_ livePhotoView: PHLivePhotoView, didEndPlaybackWith playbackStyle: PHLivePhotoViewPlaybackStyle) {
    onPlaybackStop()
  }
}
