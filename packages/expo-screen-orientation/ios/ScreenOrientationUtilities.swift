import ExpoModulesCore

internal func isPad() -> Bool {
  return UIDevice.current.userInterfaceIdiom == .pad
}

internal func doesDeviceSupport(_ orientationMask: UIInterfaceOrientationMask) -> Bool {
  if orientationMask.contains(.portraitUpsideDown) // UIInterfaceOrientationMaskPortraitUpsideDown is part of orientationMask
    && doesDeviceHaveNotch {
      // device does not support UIInterfaceOrientationMaskPortraitUpsideDown and it was requested via orientationMask
      return false
    }
    return true
}

// https://medium.com/@cafielo/how-to-detect-notch-screen-in-swift-56271827625d
internal var doesDeviceHaveNotch = {
  var bottomSafeAreaInsetIsPositive = false
  EXUtilities.performSynchronously {
    bottomSafeAreaInsetIsPositive = (UIApplication.shared.delegate?.window??.safeAreaInsets.bottom ?? 0.0) > 0.0
  }
  return bottomSafeAreaInsetIsPositive
}()

internal func maskFromOrientation(_ orientation: UIInterfaceOrientation) -> UIInterfaceOrientationMask {
  return UIInterfaceOrientationMask(rawValue: 1 << orientation.rawValue)
}

internal func interfaceOrientation(from deviceOrientation: UIDeviceOrientation) -> UIInterfaceOrientation {
  switch deviceOrientation {
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

internal func doesOrientationMask(_ orientationMask: UIInterfaceOrientationMask, contain orientation: UIInterfaceOrientation) -> Bool {
  // This is how the mask is created from the orientation
  let maskFromOrientation = maskFromOrientation(orientation)
  return orientationMask.contains(maskFromOrientation)
}

internal func defaultOrientation(for orientationMask: UIInterfaceOrientationMask) -> UIInterfaceOrientation {
  if orientationMask.contains(.portrait) {
    return .portrait
  } else if orientationMask.contains(.landscapeLeft) {
    return .landscapeLeft
  } else if orientationMask.contains(.landscapeRight) {
    return .landscapeRight
  } else if orientationMask.contains(.portraitUpsideDown) {
    return .portraitUpsideDown
  }
  return .unknown
}

internal func isIPad() -> Bool {
  return UIDevice.current.userInterfaceIdiom == .pad
}

internal func inverted<T: Hashable, D: Hashable>(_ dictionary: [T: D]) -> [D: T] {
  var invertedDictionary: [D: T] = [:]
  dictionary.forEach { key, value in
    invertedDictionary[value] = key
  }
  return invertedDictionary
}

// pragma mark - import/export

internal var orientationLockMap: [Int: UIInterfaceOrientationMask] = {
  return [
    0: .allButUpsideDown,
    1: .all,
    2: [.portrait, .portraitUpsideDown],
    3: .portrait,
    4: .portraitUpsideDown,
    5: .landscape,
    6: .landscapeLeft,
    7: .landscapeRight
  ]
}()

internal var orientationMap: [UIInterfaceOrientation: Int] = {
  return [
    .portrait: 1,
    .portraitUpsideDown: 2,
    .landscapeLeft: 3,
    .landscapeRight: 4
  ]
}()

internal func importOrientationLock(_ orientationLock: Int) -> UIInterfaceOrientationMask {
  return orientationLockMap[orientationLock] ?? []
}

internal func exportOrientationLock(_ orientationMask: UIInterfaceOrientationMask) -> Int {
  let exportedOrientation = exportOrientationLockMap(orientationMask)
  if let exportedOrientation = exportedOrientation {
    return exportedOrientation
  } else {
    if UIInterfaceOrientationMask.all.contains(orientationMask) {
      return 8
    }
    return 9
  }
}

internal func exportOrientation(_ orientation: UIInterfaceOrientation) -> Int {
  return orientationMap[orientation] ?? UIInterfaceOrientation.unknown.rawValue
}

internal func importOrientation(_ orientation: Int) -> UIInterfaceOrientation {
  let exportOrientationMap: [Int: UIInterfaceOrientation] = inverted(orientationMap)
  return exportOrientationMap[orientation] ?? .unknown
}

internal func exportOrientationLockMap(_ mask: UIInterfaceOrientationMask) -> Int? {
  switch mask {
  case .allButUpsideDown:
    return 0
  case .all:
    return 1
  case [.portrait, .portraitUpsideDown]:
    return 2
  case .portrait:
    return 3
  case .portraitUpsideDown:
    return 4
  case .landscape:
    return 5
  case .landscapeLeft:
    return 6
  case .landscapeRight:
    return 7
  default:
    return nil
  }
}

internal func orientationMaskToOrientation(_ mask: UIInterfaceOrientationMask) -> UIInterfaceOrientation {
  switch mask {
  case .portrait:
    return .portrait
  case .portraitUpsideDown:
    return.portraitUpsideDown
  case .landscapeLeft:
    return .landscapeLeft
  case .landscapeRight:
    return .landscapeRight
  // TODO: replace this with an exception
  default:
    return .portrait
  }
}
