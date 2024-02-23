// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class VideoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoVideo")

    Function("isPictureInPictureSupported") {
      return AVPictureInPictureController.isPictureInPictureSupported()
    }

    View(VideoView.self) {
      Events(
        "onPictureInPictureStart",
        "onPictureInPictureStop"
      )

      Prop("player") { (view, player: VideoPlayer?) in
        view.player = player
      }

      Prop("nativeControls") { (view, nativeControls: Bool?) in
        view.playerViewController.showsPlaybackControls = nativeControls ?? true
      }

      Prop("contentFit") { (view, contentFit: VideoContentFit?) in
        view.playerViewController.videoGravity = contentFit?.toVideoGravity() ?? .resizeAspect
      }

      Prop("contentPosition") { (view, contentPosition: CGVector?) in
        let layer = view.playerViewController.view.layer

        layer.frame = CGRect(
          x: contentPosition?.dx ?? 0,
          y: contentPosition?.dy ?? 0,
          width: layer.frame.width,
          height: layer.frame.height
        )
      }

      Prop("allowsFullscreen") { (view, allowsFullscreen: Bool?) in
        view.playerViewController.setValue(allowsFullscreen ?? true, forKey: "allowsEnteringFullScreen")
      }

      Prop("showsTimecodes") { (view, showsTimecodes: Bool?) in
        view.playerViewController.showsTimecodes = showsTimecodes ?? true
      }

      Prop("requiresLinearPlayback") { (view, requiresLinearPlayback: Bool?) in
        view.playerViewController.requiresLinearPlayback = requiresLinearPlayback ?? false
      }

      Prop("allowsPictureInPicture") { (view, allowsPictureInPicture: Bool?) in
        view.allowPictureInPicture = allowsPictureInPicture ?? false
      }

      Prop("startsPictureInPictureAutomatically") { (view, startsPictureInPictureAutomatically: Bool?) in
        view.startPictureInPictureAutomatically = startsPictureInPictureAutomatically ?? false
      }

      AsyncFunction("enterFullscreen") { view in
        view.enterFullscreen()
      }

      AsyncFunction("exitFullscreen") { view in
        view.exitFullscreen()
      }

      AsyncFunction("startPictureInPicture") { view in
        try view.startPictureInPicture()
      }

      AsyncFunction("stopPictureInPicture") { view in
        view.stopPictureInPicture()
      }
    }

    Class(VideoPlayer.self) {
      Constructor { (source: VideoSource) -> VideoPlayer in
        let player = AVPlayer()
        let videoPlayer = VideoPlayer(player)

        if let url = source.uri {
          let asset = AVURLAsset(url: url)

          if let drm = source.drm {
            try drm.type.assertIsSupported()
            videoPlayer.contentKeyManager.addContentKeyRequest(videoSource: source, asset: asset)
          }
          let playerItem = AVPlayerItem(asset: asset)
          player.replaceCurrentItem(with: playerItem)
        }

        player.pause()
        return videoPlayer
      }

      Property("isPlaying") { (player: VideoPlayer) in
        return player.pointer.timeControlStatus == .playing
      }

      Property("isMuted") { (player: VideoPlayer) -> Bool in
        return player.pointer.isMuted
      }
      .set { (player, isMuted: Bool) in
        player.pointer.isMuted = isMuted
      }

      Property("currentTime") { (player: VideoPlayer) -> Double in
        return player.pointer.currentTime().seconds
      }

      Property("staysActiveInBackground") { (player: VideoPlayer) -> Bool in
        return player.staysActiveInBackground
      }
      .set { (player, staysActive: Bool) in
        player.staysActiveInBackground = staysActive
      }

      Function("play") { player in
        player.pointer.play()
      }

      Function("pause") { player in
        player.pointer.pause()
      }

      Function("replace") { (player, source: Either<String, VideoSource>) in
        var videoSource: VideoSource?

        if source.is(String.self), let url: String = source.get() {
          videoSource = VideoSource(uri: Field(wrappedValue: URL(string: url)))
        } else if source.is(VideoSource.self) {
          videoSource = source.get()
        }

        guard
          let videoSource = videoSource,
          let url = videoSource.uri
        else {
          player.pointer.replaceCurrentItem(with: nil)
          return
        }

        let asset = AVURLAsset(url: url)
        let playerItem = AVPlayerItem(asset: asset)

        if let drm = videoSource.drm {
          try drm.type.assertIsSupported()
          player.contentKeyManager.addContentKeyRequest(videoSource: videoSource, asset: asset)
        }

        player.pointer.replaceCurrentItem(with: playerItem)
      }

      Function("seekBy") { (player, seconds: Double) in
        let newTime = player.pointer.currentTime() + CMTime(seconds: seconds, preferredTimescale: .max)

        player.pointer.seek(to: newTime)
      }

      Function("replay") { player in
        player.pointer.seek(to: CMTime.zero)
      }
    }

    OnAppEntersBackground {
      VideoManager.shared.onAppBackgrounded()
    }

    OnAppEntersForeground {
      VideoManager.shared.onAppForegrounded()
    }
  }
}
