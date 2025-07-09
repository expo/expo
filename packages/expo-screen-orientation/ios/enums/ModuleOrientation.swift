import ExpoModulesCore

enum ModuleOrientation: Int, Enumerable {
  case unknown = 0
  case portraitUp = 1
  case portraitDown = 2
  case landscapeLeft = 3
  case landscapeRight = 4

  static func from (orientation interfaceOrientation: UIInterfaceOrientation) -> ModuleOrientation {
    switch interfaceOrientation {
    case .portrait:
      return .portraitUp
    case .portraitUpsideDown:
      return .portraitDown
    case .landscapeLeft:
      return .landscapeLeft
    case .landscapeRight:
      return .landscapeRight
    case .unknown:
      return .unknown
    @unknown default:
      log.error("Unhandled `UIInterfaceOrientation` value: \(interfaceOrientation), returning `unknown` as fallback. Add the missing case as soon as possible.")
      return .unknown
    }
  }

  func toInterfaceOrientation() -> UIInterfaceOrientation {
    switch self {
    case .portraitUp:
      return .portrait
    case .portraitDown:
      return .portraitUpsideDown
    case .landscapeLeft:
      return .landscapeLeft
    case .landscapeRight:
      return .landscapeRight
    case .unknown:
      return .unknown
    }
  }
}
