import ExpoMediaSession
import Foundation
import Testing

private final class Player: SessionUseDelegate {
  let session: any MediaSessionManaging
  let queue = DispatchQueue(label: "expo.modules.mediasession.tests.player")
  var use: (any SessionUse)?
  var isPlaying = false
  var wasEndedByModule = false

  init(session: any MediaSessionManaging) {
    self.session = session
  }

  func play() {
    let previous = use
    use = session.beginUse(client: "player", requirements: .init(), delegate: self, queue: queue)
    previous?.end()
    isPlaying = true
  }

  func sessionUse(_ use: any SessionUse, pause reason: SessionPauseReason) {
    isPlaying = false
  }

  func sessionUseResume(_ use: any SessionUse) {
    isPlaying = true
  }

  func sessionUse(_ use: any SessionUse, duck isDucked: Bool) {}
  func sessionUse(_ use: any SessionUse, didFail error: Error) {}

  func sessionUseDidEnd(_ use: any SessionUse) {
    wasEndedByModule = true
  }
}

@Suite("MediaSessionManaging")
struct ManagingProtocolTests {
  @Test
  func testClientRunsAgainstTheFake() throws {
    let manager = FakeMediaSessionManager()
    let player = Player(session: manager)
    player.play()
    let first = try #require(manager.uses.first)
    player.play()

    first.pause(reason: .interruption)
    player.queue.sync {}
    #expect(player.isPlaying)
    #expect(first.isEnded)

    let current = try #require(manager.uses.last)
    current.pause(reason: .interruption)
    player.queue.sync {}
    #expect(!player.isPlaying)
    current.resume()
    player.queue.sync {}
    #expect(player.isPlaying)
  }

  @Test
  func testTheFakeEndsAUseLikeTheModule() throws {
    let manager = FakeMediaSessionManager()
    let player = Player(session: manager)
    player.play()
    let use = try #require(manager.uses.last)

    use.endByModule(reason: .outputDisconnected)
    player.queue.sync {}

    #expect(!player.isPlaying)
    #expect(player.wasEndedByModule)
    #expect(use.isEndedByModule)
  }
}
