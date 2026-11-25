import ExpoModulesCore

@ExpoModule("ExpoHaptics")
public class HapticsModule: Module {
  // Feedback generators must be used on the main thread, so these members are isolated to the main
  // actor instead of the JS thread the macro would pick for them.
  @JS
  @MainActor
  func notificationAsync(notificationType: NotificationType) async {
    let generator = UINotificationFeedbackGenerator()
    generator.prepare()
    generator.notificationOccurred(notificationType.toFeedbackType())
  }

  @JS
  @MainActor
  func impactAsync(style: ImpactStyle) async {
    let generator = UIImpactFeedbackGenerator(style: style.toFeedbackStyle())
    generator.prepare()
    generator.impactOccurred()
  }

  @JS
  @MainActor
  func selectionAsync() async {
    let generator = UISelectionFeedbackGenerator()
    generator.prepare()
    generator.selectionChanged()
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
}
