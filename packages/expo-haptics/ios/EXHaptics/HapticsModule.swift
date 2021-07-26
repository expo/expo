import ExpoModulesCore

public class HapticsModule: Module {
  public func definition() -> ModuleDefinition {
    name("ExpoHaptics")

    method("notificationAsync") { (notificationType: String, promise: Promise) in
      guard let feedbackType = NotificationType(rawValue: notificationType)?.toFeedbackType() else {
        promise.reject("E_HAPTICS_INVALID_ARG", "Notification type must be one of: 'success', 'warning', 'error'. Obtained '\(notificationType)'")
        return
      }
      let generator = UINotificationFeedbackGenerator()
      generator.prepare()
      generator.notificationOccurred(feedbackType)
      promise.resolve()
    }

    method("impactAsync") { (style: String, promise: Promise) in
      guard let feedbackStyle = ImpactStyle(rawValue: style)?.toFeedbackStyle() else {
        promise.reject("E_HAPTICS_INVALID_ARG", "Impact style must be one of: 'light', 'medium', 'heavy'. Obtained '\(style)'")
        return
      }
      let generator = UIImpactFeedbackGenerator(style: feedbackStyle)
      generator.prepare()
      generator.impactOccurred()
      promise.resolve()
    }

    method("selectionAsync") {
      let generator = UISelectionFeedbackGenerator()
      generator.prepare()
      generator.selectionChanged()
    }
  }

  enum NotificationType: String {
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

  enum ImpactStyle: String {
    case light
    case medium
    case heavy

    func toFeedbackStyle() -> UIImpactFeedbackGenerator.FeedbackStyle {
      switch self {
      case .light:
        return .light
      case .medium:
        return .medium
      case .heavy:
        return .heavy
      }
    }
  }
}
