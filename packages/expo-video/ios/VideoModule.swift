// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class VideoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoVideo")

    Function("isPictureInPictureSupported") { () -> Bool in
      return AVPictureInPictureController.isPictureInPictureSupported()
    }

    View(VideoView.self) {
      Events(
        "onPictureInPictureStart",
        "onPictureInPictureStop",
        "onFullscreenEnter",
        "onFullscreenExit"
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

      Prop("allowsVideoFrameAnalysis") { (view, allowsVideoFrameAnalysis: Bool?) in
        #if !os(tvOS)
        if #available(iOS 16.0, macCatalyst 18.0, *) {
          let newValue = allowsVideoFrameAnalysis ?? true

          view.playerViewController.allowsVideoFrameAnalysis = newValue

          // Setting the `allowsVideoFrameAnalysis` to false after the scanning was already perofrmed doesn't update the UI.
          // We can force the desired behaviour by quickly toggling the property. Setting it to true clears existing requests,
          // which updates the UI, hiding the button, then setting it to false before it detects any text keeps it in the desired state.
          // Tested in iOS 17.5
          if !newValue {
            view.playerViewController.allowsVideoFrameAnalysis = true
            view.playerViewController.allowsVideoFrameAnalysis = false
          }
        }
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

      Property("allowsExternalPlayback") { player -> Bool in
        return player.pointer.allowsExternalPlayback
      }
      .set { (player, allowsExternalPlayback: Bool) in
        player.pointer.allowsExternalPlayback = allowsExternalPlayback
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
        let currentTime = player.pointer.currentTime().seconds
        return currentTime.isNaN ? 0 : currentTime
      }
      .set { (player, time: Double) in
        // Only clamp the lower limit, AVPlayer automatically clamps the upper limit.
        let clampedTime = max(0, time)
        let timeToSeek = CMTimeMakeWithSeconds(clampedTime, preferredTimescale: .max)
        player.pointer.seek(to: timeToSeek, toleranceBefore: .zero, toleranceAfter: .zero)
      }

      Property("currentLiveTimestamp") { player -> Double? in
        return player.currentLiveTimestamp
      }

      Property("currentOffsetFromLive") { player -> Double? in
        return player.currentOffsetFromLive
      }

      Property("targetOffsetFromLive") { player -> Double in
        return player.pointer.currentItem?.configuredTimeOffsetFromLive.seconds ?? 0
      }
      .set { (player, timeOffset: Double) in
        let timeOffset = CMTime(seconds: timeOffset, preferredTimescale: .max)
        player.pointer.currentItem?.configuredTimeOffsetFromLive = timeOffset
      }

      Property("duration") { player -> Double in
        let duration = player.pointer.currentItem?.duration.seconds ?? 0
        return duration.isNaN ? 0 : duration
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

      Property("timeUpdateEventInterval") { player -> Double in
        return player.timeUpdateEventInterval
      }
      .set { (player, timeUpdateEventInterval: Double) in
        player.timeUpdateEventInterval = timeUpdateEventInterval
      }

      Property("showNowPlayingNotification") { player -> Bool in
        return player.showNowPlayingNotification
      }
      .set { (player, showNowPlayingNotification: Bool) in
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
