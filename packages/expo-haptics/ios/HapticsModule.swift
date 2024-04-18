import ExpoModulesCore

public class HapticsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoHaptics")

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
  }

  enum NotificationType: String, EnumArgument {
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

  enum ImpactStyle: String, EnumArgument {
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
