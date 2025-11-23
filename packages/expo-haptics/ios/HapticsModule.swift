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

    AsyncFunction("playPatternAsync") { (patternData: HapticPatternData) in
      guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
      guard let engine = self.hapticEngine else { return }

      let pattern = try patternData.toCHHapticPattern()
      let player = try engine.makePlayer(with: pattern)
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
}

struct HapticEventParameter: Record {
  @Field var parameterID: String
  @Field var value: Double
}

struct HapticEvent: Record {
  @Field var eventType: String
  @Field var time: Double?
  @Field var eventDuration: Double?
  @Field var parameters: [HapticEventParameter]?
}

struct HapticParameterCurveControlPoint: Record {
  @Field var relativeTime: Double
  @Field var value: Double
}

struct HapticParameterCurve: Record {
  @Field var parameterID: String
  @Field var controlPoints: [HapticParameterCurveControlPoint]?
  @Field var relativeTime: Double?
}

struct HapticPatternData: Record {
  @Field var events: [HapticEvent]
  @Field var parameterCurves: [HapticParameterCurve]?
}


extension CHHapticEvent.EventType {
  init(from string: String) throws {
    switch string {
    case "hapticTransient": self = .hapticTransient
    case "hapticContinuous": self = .hapticContinuous
    default:
      throw NSError(domain: "ExpoHaptics", code: 1, userInfo: [NSLocalizedDescriptionKey: "Unknown event type: \(string)"])
    }
  }
}

extension CHHapticEvent.ParameterID {
  init(from string: String) throws {
    switch string {
    case "hapticIntensity": self = .hapticIntensity
    case "hapticSharpness": self = .hapticSharpness
    case "attackTime": self = .attackTime
    case "decayTime": self = .decayTime
    case "releaseTime": self = .releaseTime
    case "sustained": self = .sustained
    default:
      throw NSError(domain: "ExpoHaptics", code: 2, userInfo: [NSLocalizedDescriptionKey: "Unknown parameter ID: \(string)"])
    }
  }
}

extension CHHapticDynamicParameter.ID {
  init(from string: String) throws {
    switch string {
    case "hapticIntensityControl": self = .hapticIntensityControl
    case "hapticSharpnessControl": self = .hapticSharpnessControl
    default:
      throw NSError(domain: "ExpoHaptics", code: 3, userInfo: [NSLocalizedDescriptionKey: "Unknown dynamic parameter ID: \(string)"])
    }
  }
}

extension HapticEventParameter {
  func toCHHapticParameter() throws -> CHHapticEventParameter {
    let id = try CHHapticEvent.ParameterID(from: parameterID)
    return CHHapticEventParameter(parameterID: id, value: value)
  }
}

extension HapticEvent {
  func toCHHapticEvent() throws -> CHHapticEvent {
    let type = try CHHapticEvent.EventType(from: eventType)
    let params = try (parameters ?? []).map { try $0.toCHHapticParameter() }
    let timeValue = time ?? 0.0
    if let duration = eventDuration {
      return CHHapticEvent(eventType: type, parameters: params, relativeTime: timeValue, duration: duration)
    } else {
      return CHHapticEvent(eventType: type, parameters: params, relativeTime: timeValue)
    }
  }
}

extension HapticParameterCurveControlPoint {
  func toCHHapticParameterCurveControlPoint() -> CHHapticParameterCurve.ControlPoint {
    CHHapticParameterCurve.ControlPoint(relativeTime: relativeTime, value: value)
  }
}

extension HapticParameterCurve {
  func toCHHapticParameterCurve() throws -> CHHapticParameterCurve {
    let id = try CHHapticDynamicParameter.ID(from: parameterID)
    let points = (controlPoints ?? []).map { $0.toCHHapticParameterCurveControlPoint() }
    let startTime = relativeTime ?? 0.0
    return try CHHapticParameterCurve(parameterID: id, controlPoints: points, relativeTime: startTime)
  }
}

extension HapticPatternData {
  func toCHHapticPattern() throws -> CHHapticPattern {
    let events = try self.events.map { try $0.toCHHapticEvent() }
    let curves = try (self.parameterCurves ?? []).map { try $0.toCHHapticParameterCurve() }
    return try CHHapticPattern(events: events, parameterCurves: curves)
  }
}

private extension HapticsModule {
  func initializeHapticEngine() {
    guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
    do {
      hapticEngine = try CHHapticEngine()
      try hapticEngine?.start()
    } catch {
      print("ExpoHaptics: Failed to initialize haptic engine: \(error)")
    }
  }

  func cleanupHapticEngine() {
    hapticEngine?.stop(completionHandler: nil)
    hapticEngine = nil
  }
}
