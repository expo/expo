import ExpoModulesCore
import UIKit

public enum HingeStatus: String, Enumerable {
  case closed
  case partiallyOpen
  case fullyOpen
  case unknown
}

/// The hinge state as sent to JS. The angle is in degrees, where 0 is closed and 180 is flat.
public struct HingeState: Equatable {
  public let angle: Double
  public let status: HingeStatus

  var dictionary: [String: Any] {
    return ["angle": angle, "status": status.rawValue]
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
    status =
      switch hinge.status {
      case .closed: .closed
      case .partiallyOpen: .partiallyOpen
      case .fullyOpen: .fullyOpen
      case .unknown: .unknown
      @unknown default: .unknown
      }
  }
}
#endif

/// The hinge as this module last saw it, for native code in other modules that must answer
/// synchronously and cannot wait for JavaScript, such as an app delegate subscriber deciding
/// `supportedInterfaceOrientationsFor` from the hinge when UIKit asks.
public enum Hinge {
  private static let lock = NSLock()
  private static var current: HingeState?
  private static var nextListenerId = 0
  private static var listeners: [Int: (HingeState?) -> Void] = [:]

  /// The current hinge, or `nil` before the first report and on devices without a hinge.
  public static var hinge: HingeState? {
    return lock.withLock { current }
  }

  /// Calls `listener` on the main thread with each change, after `hinge` has been updated.
  /// Returns an id for `removeListener`.
  @discardableResult
  public static func addListener(_ listener: @escaping (HingeState?) -> Void) -> Int {
    return lock.withLock {
      nextListenerId += 1
      listeners[nextListenerId] = listener
      return nextListenerId
    }
  }

  public static func removeListener(_ id: Int) {
    lock.withLock {
      listeners[id] = nil
    }
  }

  internal static func update(_ hinge: HingeState?) {
    let listeners = lock.withLock {
      current = hinge
      return Array(self.listeners.values)
    }
    for listener in listeners {
      listener(hinge)
    }
  }
}
