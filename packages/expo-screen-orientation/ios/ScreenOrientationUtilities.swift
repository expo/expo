import ExpoModulesCore

// Modules are not hashable. We are using a dictionary (moduleInterfaceMasks), where modules are keys.
// This class allows using them as keys by using Object Identifiers.
class HashableModule: Hashable {
  let value: Module
  init(_ value: Module) {
    self.value = value
  }

  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(value))
  }

  static func == (lhs: HashableModule, rhs: HashableModule) -> Bool {
    return ObjectIdentifier(lhs.value) == ObjectIdentifier(rhs.value)
  }

  // A wrapper function that converts a Module to an ObjectIdentifierHashableModule
  static func wrap(_ value: Module) -> HashableModule {
    return HashableModule(value)
  }
}

internal func isPad() -> Bool {
  return UIDevice.current.userInterfaceIdiom == .pad
}

// https://medium.com/@cafielo/how-to-detect-notch-screen-in-swift-56271827625d
internal var doesDeviceHaveNotch = {
  var bottomSafeAreaInsetIsPositive = false
  EXUtilities.performSynchronously {
    bottomSafeAreaInsetIsPositive = (UIApplication.shared.delegate?.window??.safeAreaInsets.bottom ?? 0.0) > 0.0
  }
  return bottomSafeAreaInsetIsPositive
}()

internal func isIPad() -> Bool {
  return UIDevice.current.userInterfaceIdiom == .pad
}

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
    if self.contains(.portraitUpsideDown) // UIInterfaceOrientationMaskPortraitUpsideDown is part of orientationMask
      && doesDeviceHaveNotch {
        // device does not support UIInterfaceOrientationMaskPortraitUpsideDown and it was requested via orientationMask
        return false
      }
      return true
  }

  internal func defaultOrientation() -> UIInterfaceOrientation {
    if self.contains(.portrait) {
      return .portrait
    } else if self.contains(.landscapeLeft) {
      return .landscapeLeft
    } else if self.contains(.landscapeRight) {
      return .landscapeRight
    } else if self.contains(.portraitUpsideDown) {
      return .portraitUpsideDown
    }
    return .unknown
  }
}

extension UIInterfaceOrientation {
  internal func toInterfaceOrientationMask() -> UIInterfaceOrientationMask {
    return UIInterfaceOrientationMask(rawValue: 1 << self.rawValue)
  }
}

extension UIDeviceOrientation {
  func toInterfaceOrientation() -> UIInterfaceOrientation {
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
