import ExpoModulesCore

@ExpoModule("ExpoSpeech")
public final class SpeechModule: Module, SpeechResultHadler {
  private let synthesizer = AVSpeechSynthesizer()
  private var delegate: SpeechDelegate?

  @Event("Exponent.speakingStarted")
  var onSpeakingStarted: (SpeechEvent) -> Void

  @Event("Exponent.speakingWillSayNextString")
  var onSpeakingWillSayNextString: (SpeechWillSayNextStringEvent) -> Void

  @Event("Exponent.speakingDone")
  var onSpeakingDone: (SpeechEvent) -> Void

  @Event("Exponent.speakingStopped")
  var onSpeakingStopped: (SpeechEvent) -> Void

  @Event("Exponent.speakingError")
  var onSpeakingError: (SpeechEvent) -> Void

  public override func didCreate() {
    delegate = SpeechDelegate(resultHandler: self)
    synthesizer.delegate = delegate
  }

  @JS
  func speak(utteranceId: String, text: String, options: SpeechOptions) async throws {
    let utterance = ExpoSpeechUtterance(id: utteranceId, text: text)

    if let language = options.language {
      utterance.voice = AVSpeechSynthesisVoice(language: language)
    }

    if let voice = options.voice {
      utterance.voice = AVSpeechSynthesisVoice(identifier: voice)

      guard utterance.voice != nil else {
        throw InvalidVoiceException(voice)
      }
    }

    if let pitch = options.pitch {
      utterance.pitchMultiplier = Float(pitch)
    }

    if let rate = options.rate {
      utterance.rate = Float(rate) * AVSpeechUtteranceDefaultSpeechRate
    }

    if let volume = options.volume {
      utterance.volume = min(max(volume, 0.0), 1.0);
    }

    if let useApplicationAudioSession = options.useApplicationAudioSession {
      synthesizer.usesApplicationAudioSession = useApplicationAudioSession
    }

    synthesizer.speak(utterance)
  }

  @JS(.concurrent)
  func getVoices() async -> [VoiceInfo] {
    let voices = AVSpeechSynthesisVoice.speechVoices()

    let availableVoicesResult = voices.map { voice in
      VoiceInfo(
        identifier: voice.identifier,
        name: voice.name,
        quality: voice.quality == .enhanced ? "Enhanced" : "Default",
        language: voice.language
      )
    }

    return availableVoicesResult
  }

  @JS
  func stop() async {
    synthesizer.stopSpeaking(at: .immediate)
  }

  @JS
  func pause() async {
    synthesizer.pauseSpeaking(at: .immediate)
  }

  @JS
  func resume() async {
    synthesizer.continueSpeaking()
  }

  @JS
  func isSpeaking() async -> Bool {
    return synthesizer.isSpeaking
  }

  func didStart(utterance: AVSpeechUtterance) {
    guard let utterance = utterance as? ExpoSpeechUtterance else {
      return
    }
    onSpeakingStarted(SpeechEvent(id: utterance.id))
  }

  func willSpeak(characterRange: NSRange, utterance: AVSpeechUtterance) {
    guard let utterance = utterance as? ExpoSpeechUtterance else {
      return
    }
    onSpeakingWillSayNextString(SpeechWillSayNextStringEvent(
      id: utterance.id,
      charIndex: characterRange.location,
      charLength: characterRange.length
    ))
  }

  func didCancel(utterance: AVSpeechUtterance) {
    guard let utterance = utterance as? ExpoSpeechUtterance else {
      return
    }
    onSpeakingStopped(SpeechEvent(id: utterance.id))
  }

  func didFinish(utterance: AVSpeechUtterance) {
    guard let utterance = utterance as? ExpoSpeechUtterance else {
      return
    }
    onSpeakingDone(SpeechEvent(id: utterance.id))
  }
}

internal class ExpoSpeechUtterance: AVSpeechUtterance {
  let id: String

  init(id: String, text: String) {
    self.id = id
    super.init(string: text)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("Not implemented")
  }
}
