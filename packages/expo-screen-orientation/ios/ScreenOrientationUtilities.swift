import ExpoModulesCore

internal func isPad() -> Bool {
  return UIDevice.current.userInterfaceIdiom == .pad
}

// https://medium.com/@cafielo/how-to-detect-notch-screen-in-swift-56271827625d
internal var doesDeviceHaveNotch = {
  var deviceHasNotch = false
  EXUtilities.performSynchronously {
    // The UIKit reads here have to happen on the main thread, and this closure
    // is not guaranteed to run there: it runs wherever `doesDeviceHaveNotch` is
    // first touched, which for a lock is `lockAsync`'s `AsyncFunction` body.
    //
    // No iPad has ever had a notch, but every iPad since 2018 has a home
    // indicator and so a positive bottom safe area inset. Without this guard
    // the check below reports a notch on every modern iPad.
    guard !isPad() else {
      return
    }
    deviceHasNotch = (UIApplication.shared.delegate?.window??.safeAreaInsets.bottom ?? 0.0) > 0.0
  }
  return deviceHasNotch
}()

extension UIInterfaceOrientationMask {
  internal func toUIInterfaceOrientation() -> UIInterfaceOrientation {
    switch self {
    case .portrait: return .portrait
    case .portraitUpsideDown: return.portraitUpsideDown
    case .landscapeLeft: return .landscapeLeft
    case .landscapeRight: return .landscapeRight
    default: return .unknown
    }
  }

  internal func contains(_ orientation: UIInterfaceOrientation) -> Bool {
    // This is how the mask is created from the orientation
    let maskFromOrientation = orientation.toInterfaceOrientationMask()
    return self.contains(maskFromOrientation)
  }

  internal func isSupportedByDevice() -> Bool {
    // Devices with a notch don't support upside down orientation mask.
    return !self.contains(.portraitUpsideDown) || !doesDeviceHaveNotch
  }

  internal func defaultOrientation() -> UIInterfaceOrientation {
    if self.contains(.portrait) {
      return .portrait
    }
    if self.contains(.landscapeLeft) {
      return .landscapeLeft
    }
    if self.contains(.landscapeRight) {
      return .landscapeRight
    }
    if self.contains(.portraitUpsideDown) {
      return .portraitUpsideDown
    }
    return .unknown
  }
}

internal func plistStringToInterfaceOrientationMask(_ maskName: String) -> UIInterfaceOrientationMask? {
  switch maskName {
  case "UIInterfaceOrientationMaskPortrait":
    return .portrait
  case "UIInterfaceOrientationMaskLandscapeLeft":
    return .landscapeLeft
  case "UIInterfaceOrientationMaskLandscapeRight":
    return .landscapeRight
  case "UIInterfaceOrientationMaskPortraitUpsideDown":
    return .portraitUpsideDown
  case "UIInterfaceOrientationMaskLandscape":
    return .landscape
  case "UIInterfaceOrientationMaskAll":
    return .all
  case "UIInterfaceOrientationMaskAllButUpsideDown":
    return .allButUpsideDown
  default:
    return nil
  }
}

internal func orientationStringToInterfaceOrientationMask(_ orientationString: String) -> UIInterfaceOrientationMask? {
  switch orientationString {
  case "UIInterfaceOrientationPortrait":
    return .portrait
  case "UIInterfaceOrientationPortraitUpsideDown":
    return .portraitUpsideDown
  case "UIInterfaceOrientationLandscapeRight":
    return .landscapeRight
  case "UIInterfaceOrientationLandscapeLeft":
    return .landscapeLeft
  default:
    return nil
  }
}

extension UIInterfaceOrientation {
  internal func toInterfaceOrientationMask() -> UIInterfaceOrientationMask {
    return UIInterfaceOrientationMask(rawValue: 1 << self.rawValue)
  }
}

extension UIDeviceOrientation {
  internal func toInterfaceOrientation() -> UIInterfaceOrientation {
    switch self {
    case .portrait:
      return .portrait
    case .portraitUpsideDown:
      return .portraitUpsideDown
      // UIDevice and UIInterface landscape orientations are switched
    case .landscapeLeft:
      return .landscapeRight
    case .landscapeRight:
      return .landscapeLeft
    default:
      return .unknown
    }
  }
}

extension UITraitCollection {
  internal func isPortrait() -> Bool {
    return verticalSizeClass == .regular && horizontalSizeClass == .compact
  }

  internal func isLandscape() -> Bool {
    return (verticalSizeClass == .compact && horizontalSizeClass == .compact)
    || (verticalSizeClass == .regular && horizontalSizeClass == .regular)
    || (verticalSizeClass == .compact && horizontalSizeClass == .regular)
  }
}
