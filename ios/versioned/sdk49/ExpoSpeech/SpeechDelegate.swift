import Speech

protocol SpeechResultHadler {
  func didStart(utterance: AVSpeechUtterance)
  func willSpeak(characterRange: NSRange, utterance: AVSpeechUtterance)
  func didCancel(utterance: AVSpeechUtterance)
  func didFinish(utterance: AVSpeechUtterance)
}

class SpeechDelegate: NSObject, AVSpeechSynthesizerDelegate {
  let resultHandler: SpeechResultHadler

  init(resultHandler: SpeechResultHadler) {
    self.resultHandler = resultHandler
  }

  func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didStart utterance: AVSpeechUtterance) {
    resultHandler.didStart(utterance: utterance)
  }

  func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, willSpeakRangeOfSpeechString characterRange: NSRange, utterance: AVSpeechUtterance) {
    resultHandler.willSpeak(characterRange: characterRange, utterance: utterance)
  }

  func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
    resultHandler.didCancel(utterance: utterance)
  }

  func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
    resultHandler.didFinish(utterance: utterance)
  }
}
