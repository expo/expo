import Testing
import AVFoundation

@testable import ExpoAudio

@Suite("StringConversions")
struct StringConversionsTests {
  @Test(arguments: [
    (AVPlayer.Status.readyToPlay, "readyToPlay"),
    (.failed, "failed"),
    (.unknown, "unknown"),
  ] as [(AVPlayer.Status, String)])
  func `maps player status to string`(status: AVPlayer.Status, expected: String) {
    #expect(statusToString(status: status) == expected)
  }

  @Test(arguments: [
    (AVPlayer.TimeControlStatus.playing, "playing"),
    (.paused, "paused"),
    (.waitingToPlayAtSpecifiedRate, "waitingToPlayAtSpecifiedRate"),
  ] as [(AVPlayer.TimeControlStatus, String)])
  func `maps time control status to string`(status: AVPlayer.TimeControlStatus, expected: String) {
    #expect(timeControlStatusString(status: status) == expected)
  }

  @Test(arguments: [
    (AVPlayer.WaitingReason.evaluatingBufferingRate, "evaluatingBufferingRate"),
    (.noItemToPlay, "noItemToPlay"),
    (.toMinimizeStalls, "toMinimizeStalls"),
  ] as [(AVPlayer.WaitingReason, String)])
  func `maps waiting reason to string`(reason: AVPlayer.WaitingReason, expected: String) {
    #expect(reasonForWaitingToPlayString(status: reason) == expected)
  }

  @Test
  func `maps a nil waiting reason to unknown`() {
    #expect(reasonForWaitingToPlayString(status: nil) == "unknown")
  }
}
