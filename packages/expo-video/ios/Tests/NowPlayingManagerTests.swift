import AVFoundation
import MediaPlayer
import Testing

@testable import ExpoVideo

@Suite("NowPlayingManager")
struct NowPlayingManagerTests {
  @Test
  func `unregistering a player that was never registered keeps the existing now playing info`() throws {
    let center = MPNowPlayingInfoCenter.default()
    let previousInfo = center.nowPlayingInfo
    defer { center.nowPlayingInfo = previousInfo }
    center.nowPlayingInfo = [MPMediaItemPropertyTitle: "Other module"]

    let manager = NowPlayingManager()
    let player = try VideoPlayer(AVPlayer(), initialSource: nil)

    manager.unregisterPlayer(player)

    #expect(center.nowPlayingInfo?[MPMediaItemPropertyTitle] as? String == "Other module")
  }
}
