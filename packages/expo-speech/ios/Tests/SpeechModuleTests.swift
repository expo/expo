// Copyright 2026-present 650 Industries. All rights reserved.

import AVFoundation
import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore
@testable import ExpoSpeech

@Suite("SpeechModule")
@JavaScriptActor
struct SpeechModuleTests {
  let appContext: AppContext
  let runtime: ExpoRuntime
  let module: SpeechModule

  init() throws {
    appContext = TestAppContext()
    runtime = try appContext.runtime
    module = SpeechModule(appContext: appContext)
    appContext.moduleRegistry.register(
      holder: ModuleHolder(
        appContext: appContext,
        module: module,
        name: "ExpoSpeech"
      )
    )
    _ = try runtime.eval(
      """
      var Speech = expo.modules.ExpoSpeech;
      // Resolves to the code and the message of the error that rejects the promise, or to 'resolved'.
      function rejection(promise) {
        return promise.then(
          function () {
            return 'resolved';
          },
          function (error) {
            return error.code + ': ' + error.message;
          }
        );
      }
      // Resolves to the JSON of the first payload of the event.
      function nextEvent(eventName) {
        return new Promise(function (resolve) {
          var subscription = Speech.addListener(eventName, function (payload) {
            subscription.remove();
            resolve(JSON.stringify(payload));
          });
        });
      }
      """
    )
  }

  // MARK: - Functions

  @Test
  func `speak rejects a voice identifier that does not exist`() async throws {
    // The options have the callbacks that `Speech.speak` passes in JavaScript, which the record ignores.
    let result = try await runtime.evalAsync(
      """
      rejection(Speech.speak('1', 'Hello', {
        voice: 'com.expo.invalid-voice',
        pitch: 1.5,
        onStart: function () {},
        onDone: function () {}
      }))
      """
    )
    let message = try result.asString()

    #expect(message.hasPrefix("ERR_INVALID_VOICE: "))
    #expect(message.contains("Cannot find voice with identifier: com.expo.invalid-voice!"))
  }

  @Test
  func `getVoices resolves to the voices of the system`() async throws {
    let voices = AVSpeechSynthesisVoice.speechVoices()
    let result = try await runtime.evalAsync(
      """
      Speech.getVoices().then(function (voices) {
        return JSON.stringify(voices.map(function (voice) {
          return [voice.identifier, voice.name, voice.quality, voice.language];
        }));
      })
      """
    )
    let expected = voices.map { voice in
      [voice.identifier, voice.name, voice.quality == .enhanced ? "Enhanced" : "Default", voice.language]
    }
    let actual = try JSONDecoder().decode([[String]].self, from: Data(result.asString().utf8))

    #expect(actual == expected)
  }

  @Test
  func `isSpeaking resolves to false while nothing is spoken`() async throws {
    let result = try await runtime.evalAsync("Speech.isSpeaking()")

    #expect(try result.asBool() == false)
  }

  @Test
  func `stop, pause and resume resolve while nothing is spoken`() async throws {
    let result = try await runtime.evalAsync(
      """
      Promise.all([Speech.stop(), Speech.pause(), Speech.resume()]).then(function (results) {
        return results.every(function (result) { return result === undefined; });
      })
      """
    )

    #expect(try result.asBool() == true)
  }

  // MARK: - Events

  @Test
  func `didStart emits speakingStarted with the utterance id`() async throws {
    try runtime.eval("globalThis.event = nextEvent('Exponent.speakingStarted')")

    module.didStart(utterance: ExpoSpeechUtterance(id: "7", text: "Hello"))

    let result = try await runtime.evalAsync("globalThis.event")
    #expect(try result.asString() == #"{"id":"7"}"#)
  }

  @Test
  func `willSpeak emits speakingWillSayNextString with the character range`() async throws {
    try runtime.eval("globalThis.event = nextEvent('Exponent.speakingWillSayNextString')")

    module.willSpeak(
      characterRange: NSRange(location: 6, length: 5),
      utterance: ExpoSpeechUtterance(id: "7", text: "Hello world")
    )

    let result = try await runtime.evalAsync("globalThis.event")
    #expect(try result.asString() == #"{"id":"7","charIndex":6,"charLength":5}"#)
  }

  @Test
  func `didFinish emits speakingDone with the utterance id`() async throws {
    try runtime.eval("globalThis.event = nextEvent('Exponent.speakingDone')")

    module.didFinish(utterance: ExpoSpeechUtterance(id: "7", text: "Hello"))

    let result = try await runtime.evalAsync("globalThis.event")
    #expect(try result.asString() == #"{"id":"7"}"#)
  }

  @Test
  func `didCancel emits speakingStopped with the utterance id`() async throws {
    try runtime.eval("globalThis.event = nextEvent('Exponent.speakingStopped')")

    module.didCancel(utterance: ExpoSpeechUtterance(id: "7", text: "Hello"))

    let result = try await runtime.evalAsync("globalThis.event")
    #expect(try result.asString() == #"{"id":"7"}"#)
  }
}
