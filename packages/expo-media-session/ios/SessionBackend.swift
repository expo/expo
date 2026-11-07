import AVFoundation

protocol SessionBackend: AnyObject, Sendable {
  var liveConfiguration: SessionConfiguration { get }
  func configure(_ session: ResolvedSession) throws
  func activate() throws
  func deactivate(notifyingOthers: Bool) throws
}

final class AVAudioSessionBackend: SessionBackend {
  var liveConfiguration: SessionConfiguration {
    let audioSession = AVAudioSession.sharedInstance()
    return SessionConfiguration(
      category: audioSession.category,
      mode: audioSession.mode,
      options: audioSession.categoryOptions
    )
  }

  func configure(_ session: ResolvedSession) throws {
    let audioSession = AVAudioSession.sharedInstance()
    let configuration = session.configuration
    if audioSession.category != configuration.category
      || audioSession.mode != configuration.mode
      || audioSession.categoryOptions != Self.reportedOptions(for: configuration.options)
    {
      try audioSession.setCategory(configuration.category, mode: configuration.mode, options: configuration.options)
    }
    if let rate = session.preferredSampleRate, audioSession.preferredSampleRate != rate {
      try audioSession.setPreferredSampleRate(rate)
    }
    if let duration = session.preferredIOBufferDuration, audioSession.preferredIOBufferDuration != duration {
      try audioSession.setPreferredIOBufferDuration(duration)
    }
  }

  func activate() throws {
    try AVAudioSession.sharedInstance().setActive(true)
  }

  func deactivate(notifyingOthers: Bool) throws {
    try AVAudioSession.sharedInstance().setActive(false, options: notifyingOthers ? .notifyOthersOnDeactivation : [])
  }

  // iOS reports .mixWithOthers alongside the options that imply it.
  private static func reportedOptions(for options: AVAudioSession.CategoryOptions) -> AVAudioSession.CategoryOptions {
    guard !options.isDisjoint(with: [.duckOthers, .interruptSpokenAudioAndMixWithOthers]) else {
      return options
    }
    return options.union(.mixWithOthers)
  }
}
