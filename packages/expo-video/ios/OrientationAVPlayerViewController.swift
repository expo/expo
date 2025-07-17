// Copyright 2025-present 650 Industries. All rights reserved.

import AVKit
import ExpoModulesCore

/**
 * AVPlayerViewController with support for locking the fullscreen orientation, and other expo-video utility methods such as `enterPictureInPicture`
 */
internal class OrientationAVPlayerViewController: AVPlayerViewController, AVPlayerViewControllerDelegate {
  weak var forwardDelegate: AVPlayerViewControllerDelegate?
  #if !os(tvOS)
  var fullscreenOrientation: UIInterfaceOrientationMask = UIDevice.current.userInterfaceIdiom == .phone ? .allButUpsideDown : .all
  #endif
  var autoExitOnRotate: Bool = false

  // Used to determine whether the user has rotated the device to the target orientation. Useful for auto-exit for example:
  // Device portrait, fullscreenOrientation - landscape
  // We could auto-exit but we would do it right away causing ugly animations and confusion, instead we wait for the user to rotate to landscape.
  // When they do, we know they acknowledged the orientaiton of the app and we can auto-exit once they rotate to a different orientation.
  // In case of: device landscape, fullscreenOrientation - landscape
  // We can set this to `true` right away.
  private var hasRotatedToTargetOrientation = false
  var isInPictureInPicture = false

  var isFullscreen: Bool = false {
    didSet {
      guard oldValue == isFullscreen else {
        return
      }
      if !isFullscreen {
        hasRotatedToTargetOrientation = false
      }
      #if os(tvOS)
      hasRotatedToTargetOrientation = true
      #else
      // Check if the current device orientation lines up with target orientation right away after entering fullscreen
      guard let deviceOrientationMask = UIDevice.current.orientation.toInterfaceOrientationMask(), isFullscreen else {
        return
      }
      hasRotatedToTargetOrientation = fullscreenOrientation.contains(deviceOrientationMask)
      #endif
    }
  }

  #if !os(tvOS)
  override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
    // Always remove the observer to avoid adding it multiple times
    NotificationCenter.default.removeObserver(
      self,
      name: UIDevice.orientationDidChangeNotification,
      object: nil
    )

    if isFullscreen {
      // Only add the observer when fullscreen, it's useful only for auto-exit
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(deviceOrientationDidChange(_:)),
        name: UIDevice.orientationDidChangeNotification,
        object: nil
      )
      return fullscreenOrientation
    }
    return super.supportedInterfaceOrientations
  }
  #endif

  convenience init(delegate: AVPlayerViewControllerDelegate?) {
    self.init()
    self.forwardDelegate = delegate
  }

  deinit {
    #if !os(tvOS)
    NotificationCenter.default.removeObserver(
      self,
      name: UIDevice.orientationDidChangeNotification,
      object: nil
    )
    #endif
  }

  func enterFullscreen(selectorUnsupportedFallback: (() -> Void)?) {
    let selectorName = "enterFullScreenAnimated:completionHandler:"
    let selectorToEnterFullScreenMode = NSSelectorFromString(selectorName)

    if self.responds(to: selectorToEnterFullScreenMode) {
      self.perform(selectorToEnterFullScreenMode, with: true, with: nil)
    } else {
      selectorUnsupportedFallback?()
    }
  }

  func exitFullscreen() {
    if !isFullscreen {
      return
    }

    let selectorName = "exitFullScreenAnimated:completionHandler:"
    let selectorToExitFullScreenMode = NSSelectorFromString(selectorName)

    if self.responds(to: selectorToExitFullScreenMode) {
      self.perform(selectorToExitFullScreenMode, with: true, with: nil)
    }
  }

  func startPictureInPicture() throws {
    if isInPictureInPicture {
      return
    }
    if !AVPictureInPictureController.isPictureInPictureSupported() {
      throw PictureInPictureUnsupportedException()
    }

    let selectorName = "startPictureInPicture"
    let selectorToStartPictureInPicture = NSSelectorFromString(selectorName)

    if self.responds(to: selectorToStartPictureInPicture) {
      self.perform(selectorToStartPictureInPicture)
    }
  }

  func stopPictureInPicture() {
    if !isInPictureInPicture {
      return
    }
    let selectorName = "stopPictureInPicture"
    let selectorToStopPictureInPicture = NSSelectorFromString(selectorName)

    if self.responds(to: selectorToStopPictureInPicture) {
      self.perform(selectorToStopPictureInPicture)
    }
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    self.delegate = self
  }

  #if !os(tvOS)
  @objc private func deviceOrientationDidChange(_ notification: Notification) {
    guard let deviceOrientationMask = UIDevice.current.orientation.toInterfaceOrientationMask(), isFullscreen else {
      return
    }
    //  IPhones generally don't support portraitUpsideDown, in that case we never want to exit, becasuse we would exit into an invalid app UI orientation
    let isPortraitUpsideDownAndUnsupported = UIDevice.current.orientation == .portraitUpsideDown && UIDevice.current.userInterfaceIdiom == .phone
    if isPortraitUpsideDownAndUnsupported {
      return
    }

    hasRotatedToTargetOrientation = fullscreenOrientation.contains(deviceOrientationMask) || hasRotatedToTargetOrientation

    if autoExitOnRotate && !fullscreenOrientation.contains(deviceOrientationMask) && hasRotatedToTargetOrientation {
      self.exitFullscreen()
    }
  }

  // MARK: - AVPlayerViewControllerDelegate
  // TODO: Forward more methods to the forward delegate as needed
  func playerViewController(
    _ playerViewController: AVPlayerViewController,
    willBeginFullScreenPresentationWithAnimationCoordinator coordinator: any UIViewControllerTransitionCoordinator
  ) {
    forwardDelegate?.playerViewController?(playerViewController, willBeginFullScreenPresentationWithAnimationCoordinator: coordinator)
    coordinator.animate(alongsideTransition: nil) { [weak self] context in
      if !context.isCancelled {
        self?.isFullscreen = true
        self?.forceRotationUpdate()
      }
    }
  }

  func playerViewController(
    _ playerViewController: AVPlayerViewController,
    willEndFullScreenPresentationWithAnimationCoordinator coordinator: any UIViewControllerTransitionCoordinator
  ) {
    forwardDelegate?.playerViewController?(playerViewController, willEndFullScreenPresentationWithAnimationCoordinator: coordinator)
    coordinator.animate(alongsideTransition: nil) { [weak self] context in
      if !context.isCancelled {
        self?.isFullscreen = false
      }
    }
  }
  #endif

  func playerViewControllerDidStartPictureInPicture(_ playerViewController: AVPlayerViewController) {
    isInPictureInPicture = true
    forwardDelegate?.playerViewControllerDidStartPictureInPicture?(playerViewController)
  }

  func playerViewControllerDidStopPictureInPicture(_ playerViewController: AVPlayerViewController) {
    isInPictureInPicture = false
    forwardDelegate?.playerViewControllerDidStopPictureInPicture?(playerViewController)
  }

  #if os(tvOS)
  func playerViewControllerWillBeginDismissalTransition(_ playerViewController: AVPlayerViewController) {
    forwardDelegate?.playerViewControllerWillBeginDismissalTransition?(playerViewController)
  }

  func playerViewControllerDidEndDismissalTransition(_ playerViewController: AVPlayerViewController) {
    forwardDelegate?.playerViewControllerDidEndDismissalTransition?(playerViewController)
  }
  #endif

  #if !os(tvOS)
  private func forceRotationUpdate() {
    if #available(iOS 16.0, *) {
      let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene
      windowScene?.requestGeometryUpdate(.iOS(interfaceOrientations: fullscreenOrientation))
    } else {
      UIViewController.attemptRotationToDeviceOrientation()
    }
  }
  #endif
}

#if !os(tvOS)
fileprivate extension UIDeviceOrientation {
  func toInterfaceOrientationMask() -> UIInterfaceOrientationMask? {
    switch self {
    case .portrait: return .portrait
    case .portraitUpsideDown: return .portraitUpsideDown
    case .landscapeLeft: return .landscapeLeft
    case .landscapeRight: return .landscapeRight
    case .unknown, .faceUp, .faceDown: return nil
    @unknown default: return nil
    }
  }
}
#endif
