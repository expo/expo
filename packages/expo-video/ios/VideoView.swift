// Copyright 2023-present 650 Industries. All rights reserved.

import AVKit
import ExpoModulesCore

public final class VideoView: ExpoView, AVPlayerViewControllerDelegate {
  lazy var playerViewController = AVPlayerViewController()

  var player: AVPlayer? {
    didSet {
      playerViewController.player = player
    }
  }

  var isFullscreen: Bool = false

  public override var bounds: CGRect {
    didSet {
      playerViewController.view.frame = self.bounds
      print("bounds didSet:", self.bounds)
    }
  }

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    clipsToBounds = true
    playerViewController.delegate = self
    playerViewController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    playerViewController.view.translatesAutoresizingMaskIntoConstraints = false
    playerViewController.view.backgroundColor = .clear

    addSubview(playerViewController.view)
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

  // MARK: - AVPlayerViewControllerDelegate

  public func playerViewController(
    _ playerViewController: AVPlayerViewController,
    willBeginFullScreenPresentationWithAnimationCoordinator coordinator: UIViewControllerTransitionCoordinator
  ) {
    log.debug("will begin fullscreen")
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
}
