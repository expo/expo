import ExpoModulesCore
import CoreHaptics


public class HapticsModule: Module {
  var hapticEngine: CHHapticEngine?

  public func definition() -> ModuleDefinition {
    Name("ExpoHaptics")

    OnCreate { self.initializeHapticEngine() }

    AsyncFunction("notificationAsync") { (notificationType: NotificationType) in
      let generator = UINotificationFeedbackGenerator()
      generator.prepare()
      generator.notificationOccurred(notificationType.toFeedbackType())
    }
    .runOnQueue(.main)

    AsyncFunction("impactAsync") { (style: ImpactStyle) in
      let generator = UIImpactFeedbackGenerator(style: style.toFeedbackStyle())
      generator.prepare()
      generator.impactOccurred()
    }
    .runOnQueue(.main)

    AsyncFunction("selectionAsync") {
      let generator = UISelectionFeedbackGenerator()
      generator.prepare()
      generator.selectionChanged()
    }
    .runOnQueue(.main)

    AsyncFunction("playPatternAsync") { (pattern: HapticPattern) in
      guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
      guard let engine = self.hapticEngine else { return }

      let chPattern = try pattern.toCHHapticPattern()
      let player = try engine.makePlayer(with: chPattern)
      try player.start(atTime: CHHapticTimeImmediate)
    }
    .runOnQueue(.main)
  }

  enum NotificationType: String, Enumerable {
    case success
    case warning
    case error

    func toFeedbackType() -> UINotificationFeedbackGenerator.FeedbackType {
      switch self {
      case .success:
        return .success
      case .warning:
        return .warning
      case .error:
        return .error
      }
    }
  }

  enum ImpactStyle: String, Enumerable {
    case light
    case medium
    case heavy
    case soft
    case rigid

    func toFeedbackStyle() -> UIImpactFeedbackGenerator.FeedbackStyle {
      switch self {
      case .light:
        return .light
      case .medium:
        return .medium
      case .heavy:
        return .heavy
      case .soft:
        return .soft
      case .rigid:
        return .rigid
      }
    }
  }

  private func initializeHapticEngine() {
    guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
    do {
      hapticEngine = try CHHapticEngine()
      try hapticEngine?.start()
    } catch {
      print("ExpoHaptics: Failed to initialize haptic engine: \(error)")
    }
  }

  private func cleanupHapticEngine() {
    hapticEngine?.stop(completionHandler: nil)
    hapticEngine = nil
  }
}
