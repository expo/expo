import ExpoModulesCore

@ExpoModule("ExpoSpeech")
public final class SpeechModule: Module, SpeechResultHadler {
  // Created on first use from a JavaScript function, so only the JavaScript thread reads it.
  private lazy var speech = SpeechActor(resultHandler: self)

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

  @JS
  func speak(utteranceId: String, text: String, options: SpeechOptions) async throws {
    try await speech.speak(id: utteranceId, text: text, options: options)
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
    await speech.stop()
  }

  @JS
  func pause() async {
    await speech.pause()
  }

  @JS
  func resume() async {
    await speech.resume()
  }

  @JS
  func isSpeaking() async -> Bool {
    return await speech.isSpeaking()
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
    onSpeakingWillSayNextString(
      SpeechWillSayNextStringEvent(
        id: utterance.id,
        charIndex: characterRange.location,
        charLength: characterRange.length
      )
    )
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
