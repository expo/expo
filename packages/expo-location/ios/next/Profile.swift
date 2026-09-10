import ExpoModulesCore
import CoreLocation

enum Profile: String, Enumerable {
  case `default`
  case automotiveNavigation
  case otherNavigation
  case fitness
  case airborne
  case lowPower

  @available(iOS 17.0, *)
  func clLocationUpdateProfile() -> CLLocationUpdate.LiveConfiguration {
    switch self {
    case .`default`, .lowPower:
      return .default
    case .automotiveNavigation:
      return .automotiveNavigation
    case .otherNavigation:
      return .otherNavigation
    case .fitness:
      return .fitness
    case .airborne:
      return .airborne
    }
  }

  func clDistanceFilter() -> CLLocationDistance {
    switch self {
    case .lowPower:
      return 3000
    case .`default`, .automotiveNavigation, .otherNavigation, .fitness, .airborne:
      return kCLDistanceFilterNone
    }
  }

  func clActivityType() -> CLActivityType {
    switch self {
    case .`default`, .lowPower:
      return .other
    case .automotiveNavigation:
      return .automotiveNavigation
    case .otherNavigation:
      return .otherNavigation
    case .fitness:
      return .fitness
    case .airborne:
      return .airborne
    }
  }
}
