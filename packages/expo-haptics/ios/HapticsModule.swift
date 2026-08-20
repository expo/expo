import ExpoModulesCore

public class HapticsModule: Module {
  // Generators are cached and re-prepared after each use so that the Taptic Engine
  // stays warm during rapid successive calls (such as haptics driven by a gesture),
  // which reduces the latency and inconsistency of the feedback.
  private lazy var notificationGenerator = UINotificationFeedbackGenerator()
  private lazy var selectionGenerator = UISelectionFeedbackGenerator()
  private lazy var impactGenerators = [ImpactStyle: UIImpactFeedbackGenerator]()

  public func definition() -> ModuleDefinition {
    Name("ExpoHaptics")

    AsyncFunction("notificationAsync") { (notificationType: NotificationType) in
      self.playNotification(notificationType)
    }
    .runOnQueue(.main)

    Function("notification") { (notificationType: NotificationType) in
      DispatchQueue.main.async {
        self.playNotification(notificationType)
      }
    }

    AsyncFunction("impactAsync") { (style: ImpactStyle) in
      self.playImpact(style)
    }
    .runOnQueue(.main)

    Function("impact") { (style: ImpactStyle) in
      DispatchQueue.main.async {
        self.playImpact(style)
      }
    }

    AsyncFunction("selectionAsync") {
      self.playSelection()
    }
    .runOnQueue(.main)

    Function("selection") {
      DispatchQueue.main.async {
        self.playSelection()
      }
    }
  }

  private func playNotification(_ notificationType: NotificationType) {
    notificationGenerator.notificationOccurred(notificationType.toFeedbackType())
    notificationGenerator.prepare()
  }

  private func playImpact(_ style: ImpactStyle) {
    let generator = impactGenerator(for: style)
    generator.impactOccurred()
    generator.prepare()
  }

  private func playSelection() {
    selectionGenerator.selectionChanged()
    selectionGenerator.prepare()
  }

  private func impactGenerator(for style: ImpactStyle) -> UIImpactFeedbackGenerator {
    if let generator = impactGenerators[style] {
      return generator
    }
    let generator = UIImpactFeedbackGenerator(style: style.toFeedbackStyle())
    impactGenerators[style] = generator
    return generator
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
