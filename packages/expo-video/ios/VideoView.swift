// Copyright 2023-present 650 Industries. All rights reserved.

import AVKit
import ExpoModulesCore

public final class VideoView: ExpoView, AVPlayerViewControllerDelegate {
  private lazy var playerViewControllerWrapper = OrientationAVPlayerViewControllerWrapper(delegate: self)
  var playerViewController: OrientationAVPlayerViewController {
    playerViewControllerWrapper.controller
  }

  weak var player: VideoPlayer? {
    didSet {
      if playerViewControllerWrapper.setPlayer(player) {
        removeFirstFrameObserver()
        addFirstFrameObserver()
      }
    }
  }

  #if os(tvOS)
  var wasPlaying: Bool = false
  let startPictureInPictureAutomatically = false
  var isFullscreen: Bool = false
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
  let onFirstFrameRender = EventDispatcher()

  var firstFrameObserver: NSKeyValueObservation?

  public override var bounds: CGRect {
    didSet {
      playerViewControllerWrapper.view.frame = bounds
      playerViewControllerWrapper.layoutControllerView()
    }
  }

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    VideoManager.shared.register(videoView: self)

    clipsToBounds = true

    addFirstFrameObserver()
    addSubview(playerViewControllerWrapper.view)
  }

  deinit {
    VideoManager.shared.unregister(videoView: self)
    removeFirstFrameObserver()
  }

  func enterFullscreen() {
    let tvOSFallback = {
      #if os(tvOS)
      // For TV, save the currently playing state,
      // remove the view controller from its superview,
      // and present the view controller normally
      self.wasPlaying = self.player?.isPlaying == true
      self.playerViewController.view.removeFromSuperview()
      self.reactViewController().present(self.playerViewController, animated: true)
      self.onFullscreenEnter()
      self.isFullscreen = true
      #endif
    }
    playerViewController.enterFullscreen(selectorUnsupportedFallback: tvOSFallback)
  }

  func exitFullscreen() {
    playerViewController.exitFullscreen()
    #if os(tvOS)
    self.isFullscreen = false
    #endif
  }

  func startPictureInPicture() throws {
    try playerViewController.startPictureInPicture()
  }

  func stopPictureInPicture() {
    playerViewController.stopPictureInPicture()
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
    self.playerViewControllerWrapper.layoutControllerView()
    self.playerViewControllerWrapper.view.addSubview(self.playerViewController.view)
    // End the appearance transition
    self.playerViewController.endAppearanceTransition()
    // Ensure playing state is preserved
    if wasPlaying {
      self.player?.ref.play()
    } else {
      self.player?.ref.pause()
    }
  }
  #endif

  #if !os(tvOS)
  public func playerViewController(
    _ playerViewController: AVPlayerViewController,
    willBeginFullScreenPresentationWithAnimationCoordinator coordinator: UIViewControllerTransitionCoordinator
  ) {
    onFullscreenEnter()
  }

  public func playerViewController(
    _ playerViewController: AVPlayerViewController,
    willEndFullScreenPresentationWithAnimationCoordinator coordinator: UIViewControllerTransitionCoordinator
  ) {
    // Platform's behavior is to pause the player when exiting the fullscreen mode.
    // It seems better to continue playing, so we resume the player once the dismissing animation finishes.
    let wasPlaying = player?.isPlaying ?? false

    coordinator.animate(alongsideTransition: nil) { context in
      if !context.isCancelled && wasPlaying {
        DispatchQueue.main.async {
          self.player?.ref.play()
        }
      }

      if !context.isCancelled {
        self.onFullscreenExit()
      }
    }
  }
  #endif

  public func playerViewControllerDidStartPictureInPicture(_ playerViewController: AVPlayerViewController) {
    onPictureInPictureStart()
  }

  public func playerViewControllerDidStopPictureInPicture(_ playerViewController: AVPlayerViewController) {
    onPictureInPictureStop()
  }

  public override func didMoveToWindow() {
    // TV is doing a normal view controller present, so we should not execute
    // this code
    #if !os(tvOS)
    playerViewController.beginAppearanceTransition(self.window != nil, animated: true)
    #endif
  }

  public override func safeAreaInsetsDidChange() {
    super.safeAreaInsetsDidChange()
    playerViewControllerWrapper.refreshSafeAreaInsets()
  }

  #if !os(tvOS)
  func setFullscreenOptions(_ options: FullscreenOptions?) {
    playerViewControllerWrapper.setFullscreenOptions(options)
  }
  #endif

  private func addFirstFrameObserver() {
    firstFrameObserver = playerViewController.observe(\.isReadyForDisplay, changeHandler: { [weak self] playerViewController, _ in
      if playerViewController.isReadyForDisplay {
        self?.onFirstFrameRender()
      }
    })
  }
  private func removeFirstFrameObserver() {
    firstFrameObserver?.invalidate()
    firstFrameObserver = nil
  }
}
