import ExpoModulesCore
import CoreHaptics

enum EventType: String, Enumerable {
  case hapticTransient
  case hapticContinuous

  func toCHHapticEventType() -> CHHapticEvent.EventType {
    switch self {
    case .hapticTransient:
      return .hapticTransient
    case .hapticContinuous:
      return .hapticContinuous
    }
  }
}

enum EventParameterID: String, Enumerable {
  case hapticIntensity
  case hapticSharpness
  case attackTime
  case decayTime
  case releaseTime
  case sustained

  func toCHHapticEventParameterID() -> CHHapticEvent.ParameterID {
    switch self {
    case .hapticIntensity:
      return .hapticIntensity
    case .hapticSharpness:
      return .hapticSharpness
    case .attackTime:
      return .attackTime
    case .decayTime:
      return .decayTime
    case .releaseTime:
      return .releaseTime
    case .sustained:
      return .sustained
    }
  }
}

enum DynamicParameterID: String, Enumerable {
  case hapticIntensityControl
  case hapticSharpnessControl

  func toCHHapticDynamicParameterID() -> CHHapticDynamicParameter.ID {
    switch self {
    case .hapticIntensityControl:
      return .hapticIntensityControl
    case .hapticSharpnessControl:
      return .hapticSharpnessControl
    }
  }
}

struct HapticEventParameter: Record {
  @Field var parameterID: EventParameterID
  @Field var value: Double
}

struct HapticEvent: Record {
  @Field var eventType: EventType
  @Field var time: Double?
  @Field var eventDuration: Double?
  @Field var parameters: [HapticEventParameter]?
}

struct HapticParameterCurveControlPoint: Record {
  @Field var relativeTime: Double
  @Field var value: Double
}

struct HapticParameterCurve: Record {
  @Field var parameterID: DynamicParameterID
  @Field var controlPoints: [HapticParameterCurveControlPoint]?
  @Field var relativeTime: Double?
}

struct HapticPattern: Record {
  @Field var events: [HapticEvent]
  @Field var parameterCurves: [HapticParameterCurve]?
}

extension HapticEventParameter {
  func toCHHapticParameter() -> CHHapticEventParameter {
    CHHapticEventParameter(parameterID: parameterID.toCHHapticEventParameterID(), value: value)
  }
}

extension HapticEvent {
  func toCHHapticEvent() -> CHHapticEvent {
    let params = (parameters ?? []).map { $0.toCHHapticParameter() }
    let timeValue = time ?? 0.0
    if let duration = eventDuration {
      return CHHapticEvent(eventType: eventType.toCHHapticEventType(), parameters: params, relativeTime: timeValue, duration: duration)
    } else {
      return CHHapticEvent(eventType: eventType.toCHHapticEventType(), parameters: params, relativeTime: timeValue)
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
    let points = (controlPoints ?? []).map { $0.toCHHapticParameterCurveControlPoint() }
    let startTime = relativeTime ?? 0.0
    return try CHHapticParameterCurve(parameterID: parameterID.toCHHapticDynamicParameterID(), controlPoints: points, relativeTime: startTime)
  }
}

extension HapticPattern {
  func toCHHapticPattern() throws -> CHHapticPattern {
    let events = self.events.map { $0.toCHHapticEvent() }
    let curves = try (self.parameterCurves ?? []).map { try $0.toCHHapticParameterCurve() }
    return try CHHapticPattern(events: events, parameterCurves: curves)
  }
}
