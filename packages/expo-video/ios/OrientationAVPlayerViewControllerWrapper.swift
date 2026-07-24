// Copyright 2026-present 650 Industries. All rights reserved.

import AVKit

// AVPlayerViewController can keep stale internal references to AVPlayers after the
// owning VideoPlayer is deallocated. Recreating the controller is expensive, so this
// wrapper keeps the fast path as a plain player replacement and rebuilds the controller
// only after a previously attached VideoPlayer has emitted its deinit signal.
internal final class OrientationAVPlayerViewControllerWrapper: VideoPlayerObserverDelegate {
  private final class WeakVideoPlayer {
    weak var value: VideoPlayer?

    init(_ value: VideoPlayer) {
      self.value = value
    }
  }

  private weak var delegate: AVPlayerViewControllerDelegate?
  private var registeredPlayers: [WeakVideoPlayer] = []
  private var hasStalePlayerReference = false

  #if !os(tvOS)
  private var fullscreenOptions: FullscreenOptions?
  private var hasSetFullscreenOptions = false
  #endif

  let view = UIView()
  private(set) var controller: OrientationAVPlayerViewController

  init(delegate: AVPlayerViewControllerDelegate?) {
    self.delegate = delegate
    self.controller = OrientationAVPlayerViewController(delegate: delegate)
    view.clipsToBounds = true
    view.backgroundColor = .clear
    configure(controller)
    view.addSubview(controller.view)
  }

  @discardableResult
  func setPlayer(_ player: VideoPlayer?) -> Bool {
    if let player {
      register(player)
    }

    // Don't rebuild the controller while it's presenting fullscreen or Picture in Picture,
    // doing so would tear down the active session. Keep the flag set so the rebuild happens
    // on the next inline `setPlayer`.
    var isPresenting = controller.isInPictureInPicture
    #if !os(tvOS)
    isPresenting = isPresenting || controller.isFullscreen
    #endif

    guard hasStalePlayerReference, !isPresenting else {
      // Skip redundant assignments to avoid re-creating KVOs
      if controller.player !== player?.ref {
        controller.player = player?.ref
      }
      return false
    }

    let oldController = controller
    controller = makeController(copying: oldController)
    controller.player = player?.ref

    #if !os(tvOS)
    if view.window != nil {
      oldController.beginAppearanceTransition(false, animated: false)
      oldController.endAppearanceTransition()
    }
    #endif

    oldController.view.removeFromSuperview()
    view.addSubview(controller.view)

    #if !os(tvOS)
    if view.window != nil {
      controller.beginAppearanceTransition(true, animated: false)
      controller.endAppearanceTransition()
    }
    #endif

    hasStalePlayerReference = false
    return true
  }

  func layoutControllerView() {
    controller.view.frame = view.bounds
  }

  // This is the only way that I (@behenate) found to force re-calculation of the safe-area insets for native controls
  func refreshSafeAreaInsets() {
    controller.view.removeFromSuperview()
    view.addSubview(controller.view)
  }

  #if !os(tvOS)
  func setFullscreenOptions(_ options: FullscreenOptions?) {
    fullscreenOptions = options
    hasSetFullscreenOptions = true
    applyFullscreenOptions(to: controller)
  }
  #endif

  private func register(_ player: VideoPlayer) {
    registeredPlayers.removeAll { $0.value == nil }
    guard !registeredPlayers.contains(where: { $0.value === player }) else {
      return
    }
    registeredPlayers.append(WeakVideoPlayer(player))
    player.observer?.registerDelegate(delegate: self)
  }

  func onPlayerDeinit(player: VideoPlayer) {
    DispatchQueue.main.async { [weak self] in
      self?.hasStalePlayerReference = true
    }
  }

  private func makeController(copying oldController: OrientationAVPlayerViewController) -> OrientationAVPlayerViewController {
    let newController = OrientationAVPlayerViewController(delegate: delegate)
    configure(newController)

    newController.showsPlaybackControls = oldController.showsPlaybackControls
    newController.videoGravity = oldController.videoGravity
    newController.allowsPictureInPicturePlayback = oldController.allowsPictureInPicturePlayback
    newController.requiresLinearPlayback = oldController.requiresLinearPlayback
    newController.view.frame = oldController.view.frame

    #if os(tvOS)
    newController.isSkipForwardEnabled = oldController.isSkipForwardEnabled
    newController.isSkipBackwardEnabled = oldController.isSkipBackwardEnabled
    #else
    newController.canStartPictureInPictureAutomaticallyFromInline = oldController.canStartPictureInPictureAutomaticallyFromInline
    if #available(iOS 16.0, macCatalyst 18.0, *) {
      newController.allowsVideoFrameAnalysis = oldController.allowsVideoFrameAnalysis
    }
    newController.showsTimecodes = oldController.showsTimecodes
    applyFullscreenOptions(to: newController)
    #endif

    return newController
  }

  private func configure(_ controller: OrientationAVPlayerViewController) {
    controller.view.frame = view.bounds
    controller.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    controller.view.backgroundColor = .clear
    #if !os(tvOS)
    controller.updatesNowPlayingInfoCenter = false
    applyFullscreenOptions(to: controller)
    #endif
  }

  #if !os(tvOS)
  private func applyFullscreenOptions(to controller: OrientationAVPlayerViewController) {
    guard hasSetFullscreenOptions else {
      return
    }

    controller.fullscreenOrientation = fullscreenOptions?.orientation.toUIInterfaceOrientationMask() ?? .all
    controller.autoExitOnRotate = fullscreenOptions?.autoExitOnRotate ?? false
    controller.keepFullscreenOnPiPStop = fullscreenOptions?.keepFullscreenOnPiPStop ?? .never
    controller.setValue(fullscreenOptions?.enable ?? true, forKey: "allowsEnteringFullScreen")
  }
  #endif
}
