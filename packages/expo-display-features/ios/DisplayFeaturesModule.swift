import ExpoModulesCore

// Reserved regions and hinge state (iPhone Duo).
//
// Modeled on the reserved regions and hinge status described in Apple's "Designing for iPhone
// Duo" Human Interface Guidelines and Tech Talk 111463 ("Strike a pose with adaptive layouts on
// iPhone Duo") / Tech Talk 111464 ("Leverage multiple displays and scenes on iPhone Duo").
//
// UIView.reservedRegions(kind:) and UIHingeInteraction do not exist in any Xcode release publicly
// available as of 2026-09-10 (Xcode 27.1, which ships them, is listed by Apple as "coming later
// this month"). Referencing them is a *build-time* problem, not just a runtime one: an
// `if #available(iOS 27.1, *)` guard alone is not enough, because the symbols must still resolve
// against the SDK being compiled with. Both are gated behind the EXPO_IPHONE_DUO_SDK compilation
// condition (off by default) so this module compiles cleanly against every SDK available today,
// and starts returning real data only once someone builds with -DEXPO_IPHONE_DUO_SDK on a
// toolchain that actually has the symbols.

public class DisplayFeaturesModule: Module {
  static let displayFeaturesChangeEvent = "onDisplayFeaturesChange"
  static let hingeChangeEvent = "onHingeChange"

  private var lastDisplayFeatures: [[String: Any]]?
  private var unregisterTraitChanges: (() -> Void)?

  public func definition() -> ModuleDefinition {
    Name("ExpoDisplayFeatures")

    Events(DisplayFeaturesModule.displayFeaturesChangeEvent, DisplayFeaturesModule.hingeChangeEvent)

    AsyncFunction("getDisplayFeaturesAsync") { () -> [[String: Any]] in
      DisplayFeaturesModule.currentDisplayFeatures(for: DisplayFeaturesModule.currentWindow())
    }

    AsyncFunction("getHingeAsync") { () -> [String: Any]? in
      DisplayFeaturesModule.currentHinge()
    }

    OnStartObserving {
      self.startObservingIfNeeded()
    }

    OnStopObserving {
      self.unregisterTraitChanges?()
      self.unregisterTraitChanges = nil
    }
  }

  // MARK: - Change observation

  /// Size classes are the HIG's primary signal for which iPhone Duo display is active (compact
  /// width = outer, regular width = inner), so a trait change is the closest existing hook
  /// available without the gated APIs above.
  private func startObservingIfNeeded() {
    guard unregisterTraitChanges == nil, let view = DisplayFeaturesModule.currentWindow() else {
      return
    }

    if #available(iOS 17.0, *) {
      let traits: [UITrait] = [UITraitHorizontalSizeClass.self, UITraitVerticalSizeClass.self]
      let registration = view.registerForTraitChanges(traits) { [weak self] (_: UIView, _: UITraitCollection) in
        self?.notifyIfChanged()
      }
      unregisterTraitChanges = { [weak view] in
        view?.unregisterForTraitChanges(registration)
      }
    }
  }

  private func notifyIfChanged() {
    let current = DisplayFeaturesModule.currentDisplayFeatures(for: DisplayFeaturesModule.currentWindow())
    let previous = lastDisplayFeatures
    lastDisplayFeatures = current

    if let previous = previous, (previous as NSArray).isEqual(to: current) {
      return
    }

    sendEvent(DisplayFeaturesModule.displayFeaturesChangeEvent, ["displayFeatures": current])
  }

  // MARK: - Queries

  private static func currentWindow() -> UIView? {
    return UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }
  }

  private static func currentDisplayFeatures(for view: UIView?) -> [[String: Any]] {
    #if EXPO_IPHONE_DUO_SDK
      guard #available(iOS 27.1, *), let view = view else {
        return []
      }

      var features: [[String: Any]] = []
      for region in view.reservedRegions(kind: .division) {
        features.append(encode(frame: region.frame, type: "hinge", state: "postureHalfOpened"))
      }
      for region in view.reservedRegions(kind: .occlusion) {
        features.append(encode(frame: region.frame, type: "cutout", state: "unknown"))
      }
      return features
    #else
      return []
    #endif
  }

  private static func currentHinge() -> [String: Any]? {
    #if EXPO_IPHONE_DUO_SDK
      guard #available(iOS 27.1, *) else {
        return nil
      }
      // TODO(EXPO_IPHONE_DUO_SDK): wire up a UIHingeInteraction on the key window and read its
      // status/angle here once the symbol is available to compile against.
      return nil
    #else
      return nil
    #endif
  }

  private static func encode(frame: CGRect, type: String, state: String) -> [String: Any] {
    return [
      "type": type,
      "state": state,
      "bounds": [
        "x": Double(frame.origin.x),
        "y": Double(frame.origin.y),
        "width": Double(frame.size.width),
        "height": Double(frame.size.height),
      ],
    ]
  }
}
