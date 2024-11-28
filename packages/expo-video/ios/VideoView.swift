// Copyright 2023-present 650 Industries. All rights reserved.

import AVKit
import ExpoModulesCore

public final class VideoView: ExpoView, AVPlayerViewControllerDelegate {
  lazy var playerViewController = AVPlayerViewController()

  weak var player: VideoPlayer? {
    didSet {
      playerViewController.player = player?.pointer
    }
  }

  #if os(tvOS)
  var wasPlaying: Bool = false
  #endif
  var isFullscreen: Bool = false
  var isInPictureInPicture = false
  #if os(tvOS)
  let startPictureInPictureAutomatically = false
  #else
  var startPictureInPictureAutomatically = false {
    didSet {
      playerViewController.canStartPictureInPictureAutomaticallyFromInline = startPictureInPictureAutomatically
    }
  }
  #endif

  var allowPictureInPicture: Bool = false {
    didSet {
      // PiP requires `.playback` audio session category in `.moviePlayback` mode
      VideoManager.shared.setAppropriateAudioSessionOrWarn()
      playerViewController.allowsPictureInPicturePlayback = allowPictureInPicture
    }
  }

  let onPictureInPictureStart = EventDispatcher()
  let onPictureInPictureStop = EventDispatcher()
  let onFullscreenEnter = EventDispatcher()
  let onFullscreenExit = EventDispatcher()

  public override var bounds: CGRect {
    didSet {
      playerViewController.view.frame = self.bounds
    }
  }

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    VideoManager.shared.register(videoView: self)

    clipsToBounds = true
    playerViewController.delegate = self
    playerViewController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    playerViewController.view.backgroundColor = .clear
    // Now playing is managed by the `NowPlayingManager`
    #if !os(tvOS)
    playerViewController.updatesNowPlayingInfoCenter = false
    #endif

    addSubview(playerViewController.view)
  }

  deinit {
    VideoManager.shared.unregister(videoView: self)
  }

  func enterFullscreen() {
    if isFullscreen {
      return
    }
    let selectorName = "enterFullScreenAnimated:completionHandler:"
    let selectorToForceFullScreenMode = NSSelectorFromString(selectorName)

    if playerViewController.responds(to: selectorToForceFullScreenMode) {
      playerViewController.perform(selectorToForceFullScreenMode, with: true, with: nil)
    } else {
      #if os(tvOS)
      // For TV, save the currently playing state,
      // remove the view controller from its superview,
      // and present the view controller normally
      wasPlaying = player?.isPlaying == true
      self.playerViewController.view.removeFromSuperview()
      self.reactViewController().present(self.playerViewController, animated: true)
      onFullscreenEnter()
      isFullscreen = true
      #endif
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
    if !AVPictureInPictureController.isPictureInPictureSupported() {
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

  // MARK: - AVPlayerViewControllerDelegate

  #if os(tvOS)
  // TV actually presents the playerViewController, so it implements the view controller
  // dismissal delegate methods
  public func playerViewControllerWillBeginDismissalTransition(_ playerViewController: AVPlayerViewController) {
    // Start an appearance transition
    self.playerViewController.beginAppearanceTransition(true, animated: true)
  }

  public func playerViewControllerDidEndDismissalTransition(_ playerViewController: AVPlayerViewController) {
    self.onFullscreenExit()
    self.isFullscreen = false
    // Reset the bounds of the view controller and add it back to our view
    self.playerViewController.view.frame = self.bounds
    addSubview(self.playerViewController.view)
    // End the appearance transition
    self.playerViewController.endAppearanceTransition()
    // Ensure playing state is preserved
    if wasPlaying {
      self.player?.pointer.play()
    } else {
      self.player?.pointer.pause()
    }
  }
  #endif

  #if !os(tvOS)
  public func playerViewController(
    _ playerViewController: AVPlayerViewController,
    willBeginFullScreenPresentationWithAnimationCoordinator coordinator: UIViewControllerTransitionCoordinator
  ) {
    onFullscreenEnter()
    isFullscreen = true
  }

  public func playerViewController(
    _ playerViewController: AVPlayerViewController,
    willEndFullScreenPresentationWithAnimationCoordinator coordinator: UIViewControllerTransitionCoordinator
  ) {
    // Platform's behavior is to pause the player when exiting the fullscreen mode.
    // It seems better to continue playing, so we resume the player once the dismissing animation finishes.
    let wasPlaying = player?.pointer.timeControlStatus == .playing

    coordinator.animate(alongsideTransition: nil) { context in
      if !context.isCancelled {
        if wasPlaying {
          self.player?.pointer.play()
        }
        self.onFullscreenExit()
        self.isFullscreen = false
      }
    }
  }
  #endif

  public func playerViewControllerDidStartPictureInPicture(_ playerViewController: AVPlayerViewController) {
    isInPictureInPicture = true
    onPictureInPictureStart()
  }

  public func playerViewControllerDidStopPictureInPicture(_ playerViewController: AVPlayerViewController) {
    isInPictureInPicture = false
    onPictureInPictureStop()
  }

  public override func didMoveToWindow() {
    // TV is doing a normal view controller present, so we should not execute
    // this code
    #if !os(tvOS)
    playerViewController.beginAppearanceTransition(self.window != nil, animated: true)
    #endif
  }
}
