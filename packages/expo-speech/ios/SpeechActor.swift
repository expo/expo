import AVFoundation
import ExpoModulesCore

/**
 Owns the speech synthesizer and runs its calls one at a time, in the order the JavaScript functions are called.
 The calls run on a serial dispatch queue instead of the JavaScript thread or the cooperative thread pool,
 because the first voice lookup in a process can block for hundreds of milliseconds.
 */
internal actor SpeechActor {
  private nonisolated let executor = SpeechExecutor(queue: DispatchQueue(label: "expo.modules.speech"))

  nonisolated var unownedExecutor: UnownedSerialExecutor {
    executor.asUnownedSerialExecutor()
  }

  private let synthesizer: AVSpeechSynthesizer
  private let delegate: SpeechDelegate

  init(resultHandler: SpeechResultHadler) {
    let synthesizer = AVSpeechSynthesizer()
    let delegate = SpeechDelegate(resultHandler: resultHandler)
    synthesizer.delegate = delegate
    self.synthesizer = synthesizer
    self.delegate = delegate
  }

  func speak(id: String, text: String, options: SpeechOptions) throws {
    let utterance = ExpoSpeechUtterance(id: id, text: text)

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

  func stop() {
    synthesizer.stopSpeaking(at: .immediate)
  }

  func pause() {
    synthesizer.pauseSpeaking(at: .immediate)
  }

  func resume() {
    synthesizer.continueSpeaking()
  }

  func isSpeaking() -> Bool {
    return synthesizer.isSpeaking
  }
}

/**
 Runs the jobs of `SpeechActor` on a serial dispatch queue. `DispatchSerialQueue` can't be used as the executor,
 because it is available only from iOS 17.
 */
private final class SpeechExecutor: SerialExecutor {
  private let queue: DispatchQueue

  init(queue: DispatchQueue) {
    self.queue = queue
  }

  func enqueue(_ job: UnownedJob) {
    queue.async {
      job.runSynchronously(on: self.asUnownedSerialExecutor())
    }
  }

  func asUnownedSerialExecutor() -> UnownedSerialExecutor {
    UnownedSerialExecutor(ordinary: self)
  }
}
