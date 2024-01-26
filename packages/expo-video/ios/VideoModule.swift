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
        view.player = player?.pointer
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
      Constructor { (source: String?) -> VideoPlayer in
        if let source, let url = URL(string: source) {
          let item = AVPlayerItem(url: url)
          return VideoPlayer(AVPlayer(playerItem: item))
        }
        return VideoPlayer(AVPlayer())
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

      Function("play") { player in
        player.pointer.play()
      }

      Function("pause") { player in
        player.pointer.pause()
      }

      Function("replace") { (player, source: String) in
        guard let url = URL(string: source) else {
          player.pointer.replaceCurrentItem(with: nil)
          return
        }
        let newPlayerItem = AVPlayerItem(url: url)

        player.pointer.replaceCurrentItem(with: newPlayerItem)
        player.pointer.play()
      }

      Function("seekBy") { (player, seconds: Double) in
        let newTime = player.pointer.currentTime() + CMTime(seconds: seconds, preferredTimescale: .max)

        player.pointer.seek(to: newTime)
      }

      Function("replay") { player in
        player.pointer.seek(to: CMTime.zero)
      }
    }
  }
}
