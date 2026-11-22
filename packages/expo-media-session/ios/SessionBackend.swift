import AVFoundation

protocol SessionBackend: AnyObject, Sendable {
  var liveConfiguration: SessionConfiguration { get }
  @discardableResult
  func configure(_ session: ResolvedSession) throws -> Bool
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

  func configure(_ session: ResolvedSession) throws -> Bool {
    let audioSession = AVAudioSession.sharedInstance()
    let configuration = session.configuration
    var wrote = false
    if audioSession.category != configuration.category
      || audioSession.mode != configuration.mode
      || audioSession.categoryOptions != Self.reportedOptions(for: configuration.options)
    {
      wrote = true
      try audioSession.setCategory(configuration.category, mode: configuration.mode, options: configuration.options)
    }
    if let rate = session.preferredSampleRate, audioSession.preferredSampleRate != rate {
      wrote = true
      try audioSession.setPreferredSampleRate(rate)
    }
    if let duration = session.preferredIOBufferDuration, audioSession.preferredIOBufferDuration != duration {
      wrote = true
      try audioSession.setPreferredIOBufferDuration(duration)
    }
    return wrote
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
