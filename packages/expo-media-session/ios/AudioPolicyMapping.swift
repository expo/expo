import AVFoundation
import ExpoModulesCore

public struct SessionConfiguration: Equatable, Sendable {
  public var category: AVAudioSession.Category
  public var mode: AVAudioSession.Mode
  public var options: AVAudioSession.CategoryOptions

  public init(
    category: AVAudioSession.Category = .playback,
    mode: AVAudioSession.Mode = .default,
    options: AVAudioSession.CategoryOptions = []
  ) {
    self.category = category
    self.mode = mode
    self.options = options
  }
}

public struct ResolvedSession: Equatable, Sendable {
  public let interruptionMode: InterruptionMode
  public let configuration: SessionConfiguration
  public let preferredSampleRate: Double?
  public let preferredIOBufferDuration: TimeInterval?
  public let notifiesOthersOnDeactivation: Bool
}

public final class InvalidAudioPolicyException: GenericException<String>, @unchecked Sendable {
  override public var reason: String {
    param
  }
}

extension AudioPolicy {
  public func validate() throws {
    guard !playsInSilentMode else {
      return
    }
    if interruptionMode == .duckOthers {
      throw InvalidAudioPolicyException(
        "The audio policy sets interruptionMode to duckOthers while playsInSilentMode is false. iOS cannot duck other audio in a session that follows the silent switch. Set playsInSilentMode to true or choose another interruptionMode"
      )
    }
    if allowsRecording {
      throw InvalidAudioPolicyException(
        "The audio policy sets allowsRecording to true while playsInSilentMode is false. Recording needs a session that ignores the silent switch. Set playsInSilentMode to true or allowsRecording to false"
      )
    }
    if shouldPlayInBackground {
      throw InvalidAudioPolicyException(
        "The audio policy sets shouldPlayInBackground to true while playsInSilentMode is false. Background playback needs a session that ignores the silent switch. Set playsInSilentMode to true or shouldPlayInBackground to false"
      )
    }
  }
}

public enum SessionResolver {
  public static func resolve(policy: AudioPolicy, requirements: [SessionRequirements]) -> ResolvedSession {
    var interruptionMode =
      requirements
      .compactMap { $0.mixing?.interruptionMode }
      .reduce(policy.interruptionMode) { $1.mixingRank > $0.mixingRank ? $1 : $0 }

    var effectivePolicy = policy
    effectivePolicy.interruptionMode = interruptionMode

    let capabilities = requirements.reduce(into: SessionCapabilities()) { $0.formUnion($1.capabilities) }
    var mode: AVAudioSession.Mode =
      capabilities.contains(.measurement)
      ? .measurement
      : requirements
        .compactMap(\.mode)
        .reduce(AVAudioSession.Mode.default) { specificity(of: $1) > specificity(of: $0) ? $1 : $0 }

    let inputCapabilities: SessionCapabilities = [.record, .measurement]
    let needsInput = !capabilities.isDisjoint(with: inputCapabilities)
    let isInputOnly =
      !requirements.isEmpty && requirements.allSatisfy { !$0.capabilities.isDisjoint(with: inputCapabilities) }
    let needsChat = chatModes.contains(mode)

    var category = baseCategory(for: effectivePolicy)
    var options = baseOptions(for: effectivePolicy, category: category)

    if needsInput || needsChat {
      if category != .playback && category != .playAndRecord && isInputOnly && !needsChat {
        category = .record
        options = []
        if !interruptionMode.preventsMixing {
          interruptionMode = .doNotMix
        }
      } else {
        category = .playAndRecord
        options = baseOptions(for: effectivePolicy, category: category, forcingSilentModePlayback: true)
      }
    }

    if mode == .moviePlayback && category != .playback {
      mode = .default
    }

    for requirement in requirements {
      options.formUnion(requirement.extraOptions.subtracting(mixingOptions))
    }
    options.subtract(unsupportedOptions(options, in: category))

    return ResolvedSession(
      interruptionMode: interruptionMode,
      configuration: SessionConfiguration(category: category, mode: mode, options: options),
      preferredSampleRate: requirements.compactMap(\.preferredSampleRate).max(),
      preferredIOBufferDuration: requirements.compactMap(\.preferredIOBufferDuration).min(),
      notifiesOthersOnDeactivation: interruptionMode.notifiesOthersOnDeactivation
    )
  }

  static func unsupportedOptions(
    _ options: AVAudioSession.CategoryOptions,
    in category: AVAudioSession.Category
  ) -> AVAudioSession.CategoryOptions {
    var unsupported: AVAudioSession.CategoryOptions = []
    if category != .playAndRecord {
      unsupported.formUnion(options.intersection([.defaultToSpeaker, .allowAirPlay, .allowBluetoothA2DP]))
    }
    if category != .playAndRecord && category != .record {
      #if compiler(>=6.2)
      unsupported.formUnion(options.intersection(.allowBluetoothHFP))
      #else
      unsupported.formUnion(options.intersection(.allowBluetooth))
      #endif
    }
    return unsupported
  }

  private static let mixingOptions: AVAudioSession.CategoryOptions = [
    .mixWithOthers, .duckOthers, .interruptSpokenAudioAndMixWithOthers,
  ]

  private static let chatModes: Set<AVAudioSession.Mode> = [.voiceChat, .videoChat, .gameChat]

  private static func specificity(of mode: AVAudioSession.Mode) -> Int {
    switch mode {
    case .measurement: return 6
    case .voiceChat: return 5
    case .videoChat: return 4
    case .moviePlayback: return 3
    case .spokenAudio: return 2
    case .default: return 0
    default: return 1
    }
  }

  private static func baseCategory(for policy: AudioPolicy) -> AVAudioSession.Category {
    if !policy.playsInSilentMode {
      return policy.interruptionMode.preventsMixing ? .soloAmbient : .ambient
    }
    return policy.allowsRecording ? .playAndRecord : .playback
  }

  private static func baseOptions(
    for policy: AudioPolicy,
    category: AVAudioSession.Category,
    forcingSilentModePlayback: Bool = false
  ) -> AVAudioSession.CategoryOptions {
    guard policy.playsInSilentMode || forcingSilentModePlayback else {
      return []
    }
    var options: AVAudioSession.CategoryOptions = []
    switch policy.interruptionMode {
    case .doNotMix, .doNotMixPersistent:
      break
    case .duckOthers:
      options.insert(.duckOthers)
    case .mixWithOthers:
      options.insert(.mixWithOthers)
    }
    if category == .playAndRecord {
      if !policy.shouldRouteThroughEarpiece {
        options.insert(.defaultToSpeaker)
      }
      #if compiler(>=6.2)
      options.insert(.allowBluetoothHFP)
      #else
      options.insert(.allowBluetooth)
      #endif
    }
    return options
  }
}

extension InterruptionMode {
  fileprivate var mixingRank: Int {
    switch self {
    case .doNotMixPersistent: return 3
    case .doNotMix: return 2
    case .duckOthers: return 1
    case .mixWithOthers: return 0
    }
  }
}

extension MixingRequirement {
  fileprivate var interruptionMode: InterruptionMode {
    switch self {
    case .doNotMix: return .doNotMix
    case .duckOthers: return .duckOthers
    case .mixWithOthers: return .mixWithOthers
    }
  }
}
