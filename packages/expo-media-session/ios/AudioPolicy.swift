import AVFoundation
import ExpoModulesCore

public enum InterruptionMode: String, Enumerable, Sendable {
  case mixWithOthers
  case doNotMix
  case doNotMixPersistent
  case duckOthers

  public var preventsMixing: Bool {
    self == .doNotMix || self == .doNotMixPersistent
  }

  public var notifiesOthersOnDeactivation: Bool {
    self != .doNotMixPersistent
  }
}

public enum MixingRequirement: String, Sendable {
  case mixWithOthers
  case duckOthers
  case doNotMix
}

public struct SessionCapabilities: OptionSet, Hashable, Sendable {
  public let rawValue: Int

  public init(rawValue: Int) {
    self.rawValue = rawValue
  }

  public static let record = SessionCapabilities(rawValue: 1 << 0)
  public static let measurement = SessionCapabilities(rawValue: 1 << 1)
}

public struct AudioPolicy: Equatable, Sendable {
  public var playsInSilentMode: Bool
  public var interruptionMode: InterruptionMode
  public var allowsRecording: Bool
  public var shouldPlayInBackground: Bool
  public var shouldRouteThroughEarpiece: Bool

  public init(
    playsInSilentMode: Bool = true,
    interruptionMode: InterruptionMode = .mixWithOthers,
    allowsRecording: Bool = false,
    shouldPlayInBackground: Bool = false,
    shouldRouteThroughEarpiece: Bool = false
  ) {
    self.playsInSilentMode = playsInSilentMode
    self.interruptionMode = interruptionMode
    self.allowsRecording = allowsRecording
    self.shouldPlayInBackground = shouldPlayInBackground
    self.shouldRouteThroughEarpiece = shouldRouteThroughEarpiece
  }

  public static let `default` = AudioPolicy()

  public func merged(with update: AudioPolicyUpdate) -> AudioPolicy {
    AudioPolicy(
      playsInSilentMode: update.playsInSilentMode ?? playsInSilentMode,
      interruptionMode: update.interruptionMode ?? interruptionMode,
      allowsRecording: update.allowsRecording ?? allowsRecording,
      shouldPlayInBackground: update.shouldPlayInBackground ?? shouldPlayInBackground,
      shouldRouteThroughEarpiece: update.shouldRouteThroughEarpiece ?? shouldRouteThroughEarpiece
    )
  }
}

public struct AudioPolicyUpdate: Equatable, Sendable {
  public var playsInSilentMode: Bool?
  public var interruptionMode: InterruptionMode?
  public var allowsRecording: Bool?
  public var shouldPlayInBackground: Bool?
  public var shouldRouteThroughEarpiece: Bool?

  public init(
    playsInSilentMode: Bool? = nil,
    interruptionMode: InterruptionMode? = nil,
    allowsRecording: Bool? = nil,
    shouldPlayInBackground: Bool? = nil,
    shouldRouteThroughEarpiece: Bool? = nil
  ) {
    self.playsInSilentMode = playsInSilentMode
    self.interruptionMode = interruptionMode
    self.allowsRecording = allowsRecording
    self.shouldPlayInBackground = shouldPlayInBackground
    self.shouldRouteThroughEarpiece = shouldRouteThroughEarpiece
  }
}

public struct SessionRequirements: Equatable, Sendable {
  public var mixing: MixingRequirement?
  public var capabilities: SessionCapabilities
  public var mode: AVAudioSession.Mode?
  public var extraOptions: AVAudioSession.CategoryOptions
  public var preferredSampleRate: Double?
  public var preferredIOBufferDuration: TimeInterval?

  public init(
    mixing: MixingRequirement? = nil,
    capabilities: SessionCapabilities = [],
    mode: AVAudioSession.Mode? = nil,
    extraOptions: AVAudioSession.CategoryOptions = [],
    preferredSampleRate: Double? = nil,
    preferredIOBufferDuration: TimeInterval? = nil
  ) {
    self.mixing = mixing
    self.capabilities = capabilities
    self.mode = mode
    self.extraOptions = extraOptions
    self.preferredSampleRate = preferredSampleRate
    self.preferredIOBufferDuration = preferredIOBufferDuration
  }
}
