import ExpoModulesCore

let SPEAKING_STARTED = "Exponent.speakingStarted"
let SPEAKING_WILL_SAY_NEXT_STRING = "Exponent.speakingWillSayNextString"
let SPEAKING_DONE = "Exponent.speakingDone"
let SPEAKING_STOPPED = "Exponent.speakingStopped"
let SPEAKING_ERROR = "Exponent.speakingError"

public final class SpeechModule: Module, SpeechResultHadler {
  private var synthesizer = AVSpeechSynthesizer()
  private var delegate: SpeechDelegate?

  public func definition() -> ModuleDefinition {
    Name("ExpoSpeech")

    OnCreate {
      delegate = SpeechDelegate(resultHandler: self)
      synthesizer.delegate = delegate
    }

    Events([
      SPEAKING_STARTED,
      SPEAKING_WILL_SAY_NEXT_STRING,
      SPEAKING_DONE,
      SPEAKING_STOPPED,
      SPEAKING_ERROR
    ])

    AsyncFunction("speak") { (utteranceId: String, text: String, options: SpeechOptions) in
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

      synthesizer.speak(utterance)
    }

    AsyncFunction("getVoices") { () -> [VoiceInfo] in
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

    AsyncFunction("stop") {
      synthesizer.stopSpeaking(at: .immediate)
    }

    AsyncFunction("pause") {
      synthesizer.pauseSpeaking(at: .immediate)
    }

    AsyncFunction("resume") {
      synthesizer.continueSpeaking()
    }

    AsyncFunction("isSpeaking") {
      return synthesizer.isSpeaking
    }
  }

  func didStart(utterance: AVSpeechUtterance) {
    guard let utterance = utterance as? ExpoSpeechUtterance else {
      return
    }
    sendEvent(SPEAKING_STARTED, [
      "id": utterance.id
    ])
  }

  func willSpeak(characterRange: NSRange, utterance: AVSpeechUtterance) {
    guard let utterance = utterance as? ExpoSpeechUtterance else {
      return
    }
    sendEvent(SPEAKING_WILL_SAY_NEXT_STRING, [
      "id": utterance.id,
      "charIndex": characterRange.location,
      "charLength": characterRange.length
    ])
  }

  func didCancel(utterance: AVSpeechUtterance) {
    guard let utterance = utterance as? ExpoSpeechUtterance else {
      return
    }
    sendEvent(SPEAKING_STOPPED, [
      "id": utterance.id
    ])
  }

  func didFinish(utterance: AVSpeechUtterance) {
    guard let utterance = utterance as? ExpoSpeechUtterance else {
      return
    }
    sendEvent(SPEAKING_DONE, [
      "id": utterance.id
    ])
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
