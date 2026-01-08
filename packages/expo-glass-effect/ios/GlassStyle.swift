import ExpoModulesCore
import UIKit

public enum GlassStyle: String, Enumerable {
  case clear
  case regular
  case none

  #if compiler(>=6.2) // Xcode 26
  @available(iOS 26.0, *)
  func toUIGlassEffectStyle() -> UIGlassEffect.Style? {
    switch self {
    case .clear:
      return .clear
    case .regular:
      return .regular
    case .none:
      return nil
    }
  }
  #endif
}

public struct GlassEffectStyleConfig: Record {
  public init() {}

  @Field
  public var style: GlassStyle = .regular

  @Field
  public var animate: Bool = false

  @Field
  public var animationDuration: Double?
}
