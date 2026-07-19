// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class LivePhotoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoLivePhoto")

    View(LivePhotoView.self) {
      Events("onLoadStart", "onPreviewPhotoLoad", "onLoadComplete", "onLoadError", "onPlaybackStart", "onPlaybackStop")

      Prop("source") { (view: LivePhotoView, source: LivePhotoAsset) in
        view.source = source
      }

      Prop("isMuted") { (view: LivePhotoView, isMuted: Bool?) in
        view.livePhotoView.isMuted = isMuted ?? true
      }

      Prop("contentFit") { (view: LivePhotoView, contentFit: ContentFit?) in
        view.contentFit = contentFit ?? .contain
      }

      Prop("useDefaultGestureRecognizer") { (view: LivePhotoView, useDefaultGestureRecognizer: Bool?) in
        view.useDefaultGestureRecognizer = useDefaultGestureRecognizer ?? true
      }

      AsyncFunction("startPlayback") { (view: LivePhotoView, playbackStyle: PlaybackStyle) in
        view.livePhotoView.startPlayback(with: playbackStyle.toLivePhotoViewPlaybackStyle())
      }

      AsyncFunction("stopPlayback") { (view: LivePhotoView) in
        view.livePhotoView.stopPlayback()
      }
    }
  }
}
