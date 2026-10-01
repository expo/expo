import ExpoModulesCore
import UIKit

/// The hinge state as sent to JS. The angle is in degrees, where 0 is closed and 180 is flat.
internal struct HingeState: Equatable {
  let angle: Double
  let status: String

  var dictionary: [String: Any] {
    return ["angle": angle, "status": status]
  }
}

/// Observes the device hinge through one `UIHingeInteraction` on the app's key window and caches the
/// latest state, so `getHinge()` can answer synchronously. The interaction reports the initial state
/// when added and `nil` when its window provides no hinge updates, such as on a device without a hinge.
internal final class HingeObserver {
  static var isAvailable: Bool {
#if canImport(UIKit, _version: 9127.0.85) // iOS 27.1 SDK
    if #available(iOS 27.1, *) {
      return true
    }
#endif
    return false
  }

  var onChange: ((HingeState?) -> Void)?

  private let lock = NSLock()
  private var currentHinge: HingeState?
  private var interaction: UIInteraction?

  var hinge: HingeState? {
    return lock.withLock { currentHinge }
  }

  @MainActor
  func attach() {
#if canImport(UIKit, _version: 9127.0.85) // iOS 27.1 SDK
    guard #available(iOS 27.1, *), let window = Utilities.keyWindow() else {
      return
    }
    if let interaction, interaction.view === window {
      return
    }
    detach()
    let interaction = UIHingeInteraction { [weak self] _, update in
      self?.update(with: update.hinge.map(HingeState.init))
    }
    window.addInteraction(interaction)
    self.interaction = interaction
#endif
  }

  @MainActor
  func detach() {
    if let interaction {
      interaction.view?.removeInteraction(interaction)
    }
    interaction = nil
    update(with: nil)
  }

  private func update(with hinge: HingeState?) {
    let changed = lock.withLock {
      guard currentHinge != hinge else {
        return false
      }
      currentHinge = hinge
      return true
    }
    if changed {
      onChange?(hinge)
    }
  }
}

#if canImport(UIKit, _version: 9127.0.85) // iOS 27.1 SDK
@available(iOS 27.1, *)
extension HingeState {
  init(_ hinge: UIHinge) {
    angle = Double(hinge.angle) * 180 / .pi
    status = switch hinge.status {
    case .closed: "closed"
    case .partiallyOpen: "partiallyOpen"
    case .fullyOpen: "fullyOpen"
    case .unknown: "unknown"
    @unknown default: "unknown"
    }
  }
}
#endif
