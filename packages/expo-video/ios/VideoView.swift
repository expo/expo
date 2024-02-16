// Copyright 2023-present 650 Industries. All rights reserved.

import AVKit
import ExpoModulesCore

public final class VideoView: ExpoView, AVPlayerViewControllerDelegate {
  private var isInPictureInPicture = false
  lazy var playerViewController = AVPlayerViewController()

  var player: AVPlayer? {
    didSet {
      playerViewController.player = player
      // Now playing is updated by the `NowPlayingManager`
      playerViewController.updatesNowPlayingInfoCenter = false
    }
  }

  var isFullscreen: Bool = false
  var startPictureInPictureAutomatically = false {
    didSet {
      if #available(iOS 14.2, *) {
        playerViewController.canStartPictureInPictureAutomaticallyFromInline = startPictureInPictureAutomatically
      }
    }
  }

  var allowPictureInPicture: Bool = false {
    didSet {
      if allowPictureInPicture {
        // We need to set the audio session when the prop first changes to allow, because the PiP button in the native
        // controls shows up automatically only when a correct audioSession category is set.
        switchToActiveAudioSessionOrWarn(warning: "Failed to set the audio session category. This might break Picture in Picture functionality")
      }
      playerViewController.allowsPictureInPicturePlayback = allowPictureInPicture
    }
  }

  var staysActiveInBackground = false {
    didSet {
      if staysActiveInBackground {
        switchToActiveAudioSessionOrWarn(warning: "Failed to set the audio session category. Video may pause when the app enters background")
      }
    }
  }

  let onPictureInPictureStart = EventDispatcher()
  let onPictureInPictureStop = EventDispatcher()

  public override var bounds: CGRect {
    didSet {
      playerViewController.view.frame = self.bounds
    }
  }

  lazy var supportsPictureInPicture: Bool = {
    return AVPictureInPictureController.isPictureInPictureSupported()
  }()

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    VideoModule.videoViewManager.register(videoView: self)

    clipsToBounds = true
    playerViewController.delegate = self
    playerViewController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    playerViewController.view.backgroundColor = .clear

    addSubview(playerViewController.view)
  }

  deinit {
    VideoModule.videoViewManager.unregister(videoView: self)
  }

  func enterFullscreen() {
    if isFullscreen {
      return
    }
    let selectorName = "enterFullScreenAnimated:completionHandler:"
    let selectorToForceFullScreenMode = NSSelectorFromString(selectorName)

    if playerViewController.responds(to: selectorToForceFullScreenMode) {
      playerViewController.perform(selectorToForceFullScreenMode, with: true, with: nil)
    }
  }

  func exitFullscreen() {
    if !isFullscreen {
      return
    }
    let selectorName = "exitFullScreenAnimated:completionHandler:"
    let selectorToExitFullScreenMode = NSSelectorFromString(selectorName)

    if playerViewController.responds(to: selectorToExitFullScreenMode) {
      playerViewController.perform(selectorToExitFullScreenMode, with: true, with: nil)
    }
  }

  func startPictureInPicture() throws {
    if !supportsPictureInPicture {
      throw PictureInPictureUnsupportedException()
    }

    let selectorName = "startPictureInPicture"
    let selectorToStartPictureInPicture = NSSelectorFromString(selectorName)

    if playerViewController.responds(to: selectorToStartPictureInPicture) {
      playerViewController.perform(selectorToStartPictureInPicture)
    }
  }

  func stopPictureInPicture() {
    let selectorName = "stopPictureInPicture"
    let selectorToStopPictureInPicture = NSSelectorFromString(selectorName)

    if playerViewController.responds(to: selectorToStopPictureInPicture) {
      playerViewController.perform(selectorToStopPictureInPicture)
    }
  }

  // MARK: - Lifecycle

  func onAppBackgrounded() {
    if staysActiveInBackground {
      setPlayerTracksEnabled(enabled: isInPictureInPicture || false)
    } else if !isInPictureInPicture {
      player?.pause()
    }
  }

  func onAppForegrounded() {
    setPlayerTracksEnabled(enabled: true)
  }

  // MARK: - AVPlayerViewControllerDelegate

  public func playerViewController(
    _ playerViewController: AVPlayerViewController,
    willBeginFullScreenPresentationWithAnimationCoordinator coordinator: UIViewControllerTransitionCoordinator
  ) {
    isFullscreen = true
  }

  public func playerViewController(
    _ playerViewController: AVPlayerViewController,
    willEndFullScreenPresentationWithAnimationCoordinator coordinator: UIViewControllerTransitionCoordinator
  ) {
    // Platform's behavior is to pause the player when exiting the fullscreen mode.
    // It seems better to continue playing, so we resume the player once the dismissing animation finishes.
    let wasPlaying = player?.timeControlStatus == .playing

    coordinator.animate(alongsideTransition: nil) { context in
      if !context.isCancelled {
        if wasPlaying {
          self.player?.play()
        }
        self.isFullscreen = false
      }
    }
  }

  public func playerViewControllerDidStartPictureInPicture(_ playerViewController: AVPlayerViewController) {
    isInPictureInPicture = true
    onPictureInPictureStart()
  }

  public func playerViewControllerDidStopPictureInPicture(_ playerViewController: AVPlayerViewController) {
    isInPictureInPicture = false
    onPictureInPictureStop()
  }

  // MARK: - Utils

  /**
   * iOS automatically pauses videos when the app enters the background. Only way of avoiding this is to detach the player from the playerLayer.
   * Typical way of doing this for `AVPlayerViewController` is setting `playerViewController.player = nil`, but that makes the
   * video invisible for around a second after foregrounding, disabling the tracks requires more code, but works a lot faster.
   */
  private func setPlayerTracksEnabled(enabled: Bool) {
    if let player, let tracks = player.currentItem?.tracks {
      tracks.forEach { track in
        guard let assetTrack = track.assetTrack else {
          return
        }

        if assetTrack.hasMediaCharacteristic(AVMediaCharacteristic.visual) {
          track.isEnabled = enabled
        }
      }
    }
  }

  private func switchToActiveAudioSession() throws {
    let audioSession = AVAudioSession.sharedInstance()
    try audioSession.setCategory(.playback, mode: .default)
    try audioSession.setActive(true)
  }

  private func switchToActiveAudioSessionOrWarn(warning: String) {
    do {
      try switchToActiveAudioSession()
    } catch {
      log.warn(warning)
    }
  }
}
