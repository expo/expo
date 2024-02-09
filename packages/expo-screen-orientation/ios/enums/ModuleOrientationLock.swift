import ExpoModulesCore

internal enum ModuleOrientationLock: Int, Enumerable {
  case allButUpsideDown = 0
  case all = 1
  case portrait = 2
  case portraitUp = 3
  case portraitDown = 4
  case landscape = 5
  case landscapeLeft = 6
  case landscapeRight = 7
  case other = 8
  case unknown = 9

  static func from(mask: UIInterfaceOrientationMask) -> ModuleOrientationLock {
    switch mask {
    case .allButUpsideDown:
      return .allButUpsideDown
    case .all:
      return .all
    case [.portrait, .portraitUpsideDown]:
      return .portrait
    case .portrait:
      return .portraitUp
    case .portraitUpsideDown:
      return .portraitDown
    case .landscape:
      return .landscape
    case .landscapeLeft:
      return .landscapeLeft
    case .landscapeRight:
      return .landscapeRight
    default:
      return UIInterfaceOrientationMask.all.contains(mask) ? .other : .unknown
    }
  }

  func toInterfaceOrientationMask() -> UIInterfaceOrientationMask {
    switch self {
    case .allButUpsideDown:
      return .allButUpsideDown
    case .all:
      return .all
    case .portrait:
      return [.portrait, .portraitUpsideDown]
    case .portraitUp:
      return .portrait
    case .portraitDown:
      return .portraitUpsideDown
    case .landscape:
      return .landscape
    case .landscapeLeft:
      return .landscapeLeft
    case .landscapeRight:
      return .landscapeRight
    default:
      return []
    }
  }
}
