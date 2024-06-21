// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class VideoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoVideo")

    Function("isPictureInPictureSupported") { () -> Bool in
      if #available(iOS 13.4, tvOS 14.0, *) {
        return AVPictureInPictureController.isPictureInPictureSupported()
      }
      return false
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
        #if os(tvOS)
        view.playerViewController.isSkipForwardEnabled = nativeControls ?? true
        view.playerViewController.isSkipBackwardEnabled = nativeControls ?? true
        #endif
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
        #if !os(tvOS)
        view.playerViewController.setValue(allowsFullscreen ?? true, forKey: "allowsEnteringFullScreen")
        #endif
      }

      Prop("showsTimecodes") { (view, showsTimecodes: Bool?) in
        #if !os(tvOS)
        view.playerViewController.showsTimecodes = showsTimecodes ?? true
        #endif
      }

      Prop("requiresLinearPlayback") { (view, requiresLinearPlayback: Bool?) in
        view.playerViewController.requiresLinearPlayback = requiresLinearPlayback ?? false
      }

      Prop("allowsPictureInPicture") { (view, allowsPictureInPicture: Bool?) in
        view.allowPictureInPicture = allowsPictureInPicture ?? false
      }

      Prop("startsPictureInPictureAutomatically") { (view, startsPictureInPictureAutomatically: Bool?) in
        #if !os(tvOS)
        view.startPictureInPictureAutomatically = startsPictureInPictureAutomatically ?? false
        #endif
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
      Constructor { (source: VideoSource?) -> VideoPlayer in
        let player = AVPlayer()
        let videoPlayer = VideoPlayer(player)

        try videoPlayer.replaceCurrentItem(with: source)
        player.pause()
        return videoPlayer
      }

      Property("playing") { player -> Bool in
        return player.isPlaying
      }

      Property("muted") { player -> Bool in
        return player.isMuted
      }
      .set { (player, muted: Bool) in
        player.isMuted = muted
      }

      Property("currentTime") { player -> Double in
        return player.pointer.currentTime().seconds
      }

      Property("staysActiveInBackground") { player -> Bool in
        return player.staysActiveInBackground
      }
      .set { (player, staysActive: Bool) in
        player.staysActiveInBackground = staysActive
      }

      Property("loop") { player -> Bool in
        return player.loop
      }
      .set { (player, loop: Bool) in
        player.loop = loop
      }

      Property("currentTime") { player -> Double in
        return player.pointer.currentTime().seconds
      }
      .set { (player, time: Double) in
        // Only clamp the lower limit, AVPlayer automatically clamps the upper limit.
        let clampedTime = max(0, time)
        let timeToSeek = CMTimeMakeWithSeconds(clampedTime, preferredTimescale: .max)
        player.pointer.seek(to: timeToSeek, toleranceBefore: .zero, toleranceAfter: .zero)
      }

      Property("duration") { player -> Double in
        return player.pointer.currentItem?.duration.seconds ?? 0
      }

      Property("playbackRate") { player -> Float in
        return player.playbackRate
      }
      .set { (player, playbackRate: Float) in
        player.playbackRate = playbackRate
      }

      Property("isLive") { player -> Bool in
        return player.pointer.currentItem?.duration.isIndefinite ?? false
      }

      Property("preservesPitch") { player -> Bool in
        return player.preservesPitch
      }
      .set { (player, preservesPitch: Bool) in
        player.preservesPitch = preservesPitch
      }

      Property("showNowPlayingNotification") { player -> Bool in
        return player.showNowPlayingNotification
      }
      .set {(player, showNowPlayingNotification: Bool) in
        player.showNowPlayingNotification = showNowPlayingNotification
      }

      Property("status") { player in
        return player.status.rawValue
      }

      Property("volume") { player -> Float in
        return player.volume
      }
      .set { (player, volume: Float) in
        player.volume = volume
      }

      Function("play") { player in
        player.pointer.play()
      }

      Function("pause") { player in
        player.pointer.pause()
      }

      Function("replace") { (player, source: Either<String, VideoSource>?) in
        guard let source else {
          try player.replaceCurrentItem(with: nil)
          return
        }
        var videoSource: VideoSource?

        if source.is(String.self), let url: String = source.get() {
          videoSource = VideoSource(uri: URL(string: url))
        } else if source.is(VideoSource.self) {
          videoSource = source.get()
        }

        try player.replaceCurrentItem(with: videoSource)
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
