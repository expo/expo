import Foundation
import MediaPlayer
import Testing
import UIKit

@testable import ExpoMediaSession

@Suite("NowPlayingStack")
struct NowPlayingStackTests {
  let scheduler = ManualScheduler()
  let backend = FakeSessionBackend()
  let center = FakeNowPlayingCenter()
  let observer = RecordingObserver()
  let manager: MediaSessionManager
  let registration: ObserverRegistration

  init() throws {
    manager = MediaSessionManager(backend: backend, scheduler: scheduler, nowPlayingCenter: center)
    registration = manager.addObserver(observer)
    try manager.setPolicy(AudioPolicyUpdate(interruptionMode: .doNotMix))
  }

  private let playback: Set<RemoteCommandKind> = [.play, .pause, .togglePlayPause]

  @Test
  func testVideoTakesOverAndPodcastReturnsResumed() {
    let podcast = FakeNowPlayingOwner("podcast")
    let video = FakeNowPlayingOwner("video", mediaType: .video)
    let podcastClaim = manager.offerNowPlaying(podcast, info: NowPlayingInfo(title: "Podcast"), commands: playback)
    let videoClaim = manager.offerNowPlaying(video, info: NowPlayingInfo(title: "Video"), commands: [.play, .pause])

    #expect(podcast.events == [.pausedForTakeover])
    #expect(center.state?.info.title == "Video")
    #expect(center.targets == [.play, .pause])

    videoClaim.withdraw(.ended)

    #expect(podcast.events == [.pausedForTakeover, .resumedAfterTakeover])
    #expect(center.state?.info.title == "Podcast")
    #expect(center.targets == playback)
    #expect(manager.nowPlayingOwnerID == "podcast")
    withExtendedLifetime(podcastClaim) {}
  }

  @Test
  func testUserPausedOwnerReturnsPaused() {
    let podcast = FakeNowPlayingOwner("podcast", isPlaying: false)
    let video = FakeNowPlayingOwner("video", mediaType: .video)
    let podcastClaim = manager.offerNowPlaying(podcast, info: NowPlayingInfo(title: "Podcast"), commands: playback)
    manager.offerNowPlaying(video, info: NowPlayingInfo(title: "Video"), commands: playback).withdraw(.ended)

    #expect(manager.nowPlayingOwnerID == "podcast")
    #expect(podcast.events.isEmpty)
    #expect(center.state?.isPlaying == false)
    withExtendedLifetime(podcastClaim) {}
  }

  @Test
  func testPauseKeepsOwnership() {
    let podcast = FakeNowPlayingOwner("podcast")
    let video = FakeNowPlayingOwner("video", mediaType: .video)
    let podcastClaim = manager.offerNowPlaying(podcast, info: NowPlayingInfo(title: "Podcast"), commands: playback)
    let videoClaim = manager.offerNowPlaying(video, info: NowPlayingInfo(title: "Video"), commands: playback)

    video.isPlaying = false
    videoClaim.update(NowPlayingInfo(title: "Video", elapsedTime: 12))

    #expect(manager.nowPlayingOwnerID == "video")
    #expect(center.state?.info.title == "Video")
    #expect(center.state?.isPlaying == false)
    #expect(podcast.events == [.pausedForTakeover])
    withExtendedLifetime((podcastClaim, videoClaim)) {}
  }

  @Test
  func testReleasedOwnerBelowTopIsSkipped() {
    let a = FakeNowPlayingOwner("a")
    let b = FakeNowPlayingOwner("b")
    let c = FakeNowPlayingOwner("c")
    let aClaim = manager.offerNowPlaying(a, info: NowPlayingInfo(title: "A"), commands: playback)
    var bClaim: NowPlayingClaim? = manager.offerNowPlaying(b, info: NowPlayingInfo(title: "B"), commands: playback)
    let cClaim = manager.offerNowPlaying(c, info: NowPlayingInfo(title: "C"), commands: playback)

    #expect(bClaim != nil)
    bClaim = nil
    cClaim.withdraw(.ended)

    #expect(manager.nowPlayingOwnerID == "a")
    #expect(center.state?.info.title == "A")
    #expect(a.events == [.pausedForTakeover, .resumedAfterTakeover])
    #expect(b.events == [.pausedForTakeover])
    withExtendedLifetime(aClaim) {}
  }

  @Test
  func testMixWithOthersDoesNotPausePrevious() throws {
    try manager.setPolicy(AudioPolicyUpdate(interruptionMode: .mixWithOthers))
    let hold = manager.hold(client: "test")
    let podcast = FakeNowPlayingOwner("podcast")
    let video = FakeNowPlayingOwner("video", mediaType: .video)
    let podcastClaim = manager.offerNowPlaying(podcast, info: NowPlayingInfo(title: "Podcast"), commands: playback)
    let videoClaim = manager.offerNowPlaying(video, info: NowPlayingInfo(title: "Video"), commands: playback)

    #expect(manager.nowPlayingOwnerID == "video")
    #expect(podcast.events.isEmpty)
    #expect(podcast.isPlaying)

    videoClaim.withdraw(.ended)
    #expect(podcast.events.isEmpty)
    withExtendedLifetime((hold, podcastClaim)) {}
  }

  @Test
  func testMixWithOthersWithoutLiveUseDoesNotPausePrevious() throws {
    manager.beginUse(client: "earlier").end()
    scheduler.advance(milliseconds: 1000)
    try manager.setPolicy(AudioPolicyUpdate(interruptionMode: .mixWithOthers))
    let a = FakeNowPlayingOwner("a")
    let b = FakeNowPlayingOwner("b")
    let claims = [
      manager.offerNowPlaying(a, info: NowPlayingInfo(title: "A"), commands: playback),
      manager.offerNowPlaying(b, info: NowPlayingInfo(title: "B"), commands: playback),
    ]

    #expect(manager.nowPlayingOwnerID == "b")
    #expect(a.events.isEmpty)
    withExtendedLifetime(claims) {}
  }

  @Test
  func testIdenticalTopUpdatesEachWrite() {
    let podcast = FakeNowPlayingOwner("podcast")
    let info = NowPlayingInfo(title: "Podcast", elapsedTime: 3)
    let claim = manager.offerNowPlaying(podcast, info: info, commands: playback)
    let writes = center.applied.count

    claim.update(info)
    claim.update(info)

    #expect(center.applied.count == writes + 2)
  }

  @Test
  func testFailedArtworkLoadIsRetriedOnlyForANewURLOrOffer() {
    let url = URL(string: "https://example.com/a.png")!
    let other = URL(string: "https://example.com/b.png")!
    let info = NowPlayingInfo(title: "A", artworkURL: url)
    let owner = FakeNowPlayingOwner("a")
    let claim = manager.offerNowPlaying(owner, info: info, commands: playback)
    #expect(center.loads.count == 1)

    center.loads[0].completion(nil)
    claim.update(info)
    #expect(center.loads.count == 1)

    claim.update(NowPlayingInfo(title: "A", artworkURL: other))
    center.loads.last?.completion(nil)
    claim.update(info)
    #expect(center.loads.count == 3)
    center.loads.last?.completion(nil)

    let second = manager.offerNowPlaying(owner, info: info, commands: playback)
    #expect(center.loads.count == 4)
    let artwork = NowPlayingArtwork(image: UIImage())
    center.loads.last?.completion(artwork)
    #expect(center.state?.artwork == artwork)
    withExtendedLifetime((claim, second)) {}
  }

  @Test
  func testOwnerWhoseStateLagsThePauseIsStillResumed() {
    let podcast = FakeNowPlayingOwner("podcast")
    let video = FakeNowPlayingOwner("video", mediaType: .video)
    let podcastClaim = manager.offerNowPlaying(podcast, info: NowPlayingInfo(title: "Podcast"), commands: playback)
    let videoClaim = manager.offerNowPlaying(video, info: NowPlayingInfo(title: "Video"), commands: playback)
    podcast.isPlaying = true

    videoClaim.withdraw(.ended)

    #expect(podcast.events == [.pausedForTakeover, .resumedAfterTakeover])
    withExtendedLifetime(podcastClaim) {}
  }

  @Test
  func testOwnerTheUserResumedAndPausedReturnsPaused() {
    let podcast = FakeNowPlayingOwner("podcast")
    let video = FakeNowPlayingOwner("video", mediaType: .video)
    let info = NowPlayingInfo(title: "Podcast")
    let podcastClaim = manager.offerNowPlaying(podcast, info: info, commands: playback)
    let videoClaim = manager.offerNowPlaying(video, info: NowPlayingInfo(title: "Video"), commands: playback)
    podcastClaim.update(info)

    podcast.isPlaying = true
    podcastClaim.update(info)
    podcast.isPlaying = false
    podcastClaim.update(info)
    videoClaim.withdraw(.ended)

    #expect(podcast.events == [.pausedForTakeover])
    #expect(center.state?.isPlaying == false)
  }

  @Test
  func testArtworkArrivalKeepsThePlayingPosition() {
    let url = URL(string: "https://example.com/a.png")!
    let owner = FakeNowPlayingOwner("a")
    let info = NowPlayingInfo(title: "A", artworkURL: url, elapsedTime: 10, playbackRate: 1.5)
    let claim = manager.offerNowPlaying(owner, info: info, commands: playback)
    #expect(center.state?.info.elapsedTime == 10)

    scheduler.advance(milliseconds: 2000)
    center.loads[0].completion(NowPlayingArtwork(image: UIImage()))

    #expect(center.state?.artwork != nil)
    #expect(center.state?.info.elapsedTime == 13)
    withExtendedLifetime(claim) {}
  }

  @Test
  func testReturningOwnerPositionAdvancesOnlyWhileItKeptPlaying() throws {
    let podcast = FakeNowPlayingOwner("podcast")
    let video = FakeNowPlayingOwner("video", mediaType: .video)
    let info = NowPlayingInfo(title: "Podcast", elapsedTime: 10)
    let podcastClaim = manager.offerNowPlaying(podcast, info: info, commands: playback)

    let takeover = manager.offerNowPlaying(video, info: NowPlayingInfo(title: "Video"), commands: playback)
    scheduler.advance(milliseconds: 5000)
    takeover.withdraw(.ended)
    #expect(podcast.events == [.pausedForTakeover, .resumedAfterTakeover])
    #expect(center.state?.info.elapsedTime == 10)

    try manager.setPolicy(AudioPolicyUpdate(interruptionMode: .mixWithOthers))
    podcastClaim.update(info)
    let mixed = manager.offerNowPlaying(video, info: NowPlayingInfo(title: "Video"), commands: playback)
    scheduler.advance(milliseconds: 5000)
    mixed.withdraw(.ended)
    #expect(center.state?.info.elapsedTime == 15)
  }

  @Test
  func testCommandRoutesOnlyToTop() {
    let owners = ["a", "b", "c"].map { FakeNowPlayingOwner($0) }
    let claims = owners.map {
      manager.offerNowPlaying($0, info: NowPlayingInfo(title: $0.nowPlayingID), commands: playback)
    }

    center.send(RemoteCommand(kind: .togglePlayPause))

    #expect(owners.map(\.handledCount) == [0, 0, 1])
    #expect(owners[2].events.last == .handled(RemoteCommand(kind: .togglePlayPause)))
    withExtendedLifetime(claims) {}
  }

  @Test
  func testOfferSameOwnerTwiceMovesToTop() {
    let a = FakeNowPlayingOwner("a")
    let b = FakeNowPlayingOwner("b")
    let firstAClaim = manager.offerNowPlaying(a, info: NowPlayingInfo(title: "A1"), commands: playback)
    let bClaim = manager.offerNowPlaying(b, info: NowPlayingInfo(title: "B"), commands: playback)
    a.isPlaying = true
    let secondAClaim = manager.offerNowPlaying(a, info: NowPlayingInfo(title: "A2"), commands: playback)

    #expect(manager.nowPlayingOwnerID == "a")
    #expect(center.state?.info.title == "A2")
    center.send(RemoteCommand(kind: .pause))
    #expect(a.handledCount == 1)
    #expect(b.handledCount == 0)

    firstAClaim.withdraw(.ended)
    #expect(manager.nowPlayingOwnerID == "a")

    secondAClaim.withdraw(.ended)
    #expect(manager.nowPlayingOwnerID == "b")
    #expect(b.events == [.pausedForTakeover, .resumedAfterTakeover])

    bClaim.withdraw(.ended)
    #expect(manager.nowPlayingOwnerID == nil)
    #expect(center.state == nil)
  }

  @Test
  func testEmptyStackClearsCenter() {
    let podcast = FakeNowPlayingOwner("podcast")
    let claim = manager.offerNowPlaying(podcast, info: NowPlayingInfo(title: "Podcast"), commands: playback)
    #expect(center.targets == playback)

    claim.withdraw(.ended)

    #expect(center.applied.count == 2)
    #expect(center.applied.last! == nil)
    #expect(center.nowPlayingInfo == nil)
    #expect(center.targets.isEmpty)
    #expect(manager.nowPlayingOwnerID == nil)
  }

  @Test
  func testUpdateFromNonTopDoesNotTouchCenter() {
    let a = FakeNowPlayingOwner("a", isPlaying: false)
    let b = FakeNowPlayingOwner("b")
    let aClaim = manager.offerNowPlaying(a, info: NowPlayingInfo(title: "A", artist: "Artist"), commands: playback)
    let bClaim = manager.offerNowPlaying(b, info: NowPlayingInfo(title: "B"), commands: playback)
    let writes = center.applied.count

    aClaim.update(NowPlayingInfo(title: "A2"))

    #expect(center.applied.count == writes)
    #expect(center.state?.info.title == "B")

    bClaim.withdraw(.ended)
    #expect(center.state?.info == NowPlayingInfo(title: "A2"))
  }

  @Test
  func testMediaTypeFollowsTop() {
    let podcast = FakeNowPlayingOwner("podcast")
    let video = FakeNowPlayingOwner("video", mediaType: .video)
    let podcastClaim = manager.offerNowPlaying(podcast, info: NowPlayingInfo(title: "Podcast"), commands: playback)
    let videoClaim = manager.offerNowPlaying(video, info: NowPlayingInfo(title: "Video"), commands: playback)

    #expect(
      center.nowPlayingInfo?[MPNowPlayingInfoPropertyMediaType] as? UInt == MPNowPlayingInfoMediaType.video.rawValue
    )

    videoClaim.withdraw(.ended)
    #expect(
      center.nowPlayingInfo?[MPNowPlayingInfoPropertyMediaType] as? UInt == MPNowPlayingInfoMediaType.audio.rawValue
    )
    withExtendedLifetime(podcastClaim) {}
  }

  @Test
  func testLiveStreamHidesSeek() {
    let radio = FakeNowPlayingOwner("radio")
    let claim = manager.offerNowPlaying(radio, info: NowPlayingInfo(isLiveStream: true), commands: [.play, .seek])

    #expect(center.targets == [.play])
    #expect(center.nowPlayingInfo?[MPMediaItemPropertyPlaybackDuration] == nil)
    withExtendedLifetime(claim) {}
  }

  @Test
  func testOwnerChangeNotifiesObservers() {
    let podcast = FakeNowPlayingOwner("podcast")
    let video = FakeNowPlayingOwner("video", mediaType: .video)
    let podcastClaim = manager.offerNowPlaying(podcast, info: NowPlayingInfo(), commands: playback)
    let videoClaim = manager.offerNowPlaying(video, info: NowPlayingInfo(), commands: playback)
    videoClaim.update(NowPlayingInfo(title: "Video"))
    videoClaim.withdraw(.ended)
    podcastClaim.withdraw(.released)

    #expect(
      observer.events == [
        .nowPlayingOwnerChanged("podcast"), .nowPlayingOwnerChanged("video"), .nowPlayingOwnerChanged("podcast"),
        .nowPlayingOwnerChanged(nil),
      ]
    )
  }

  @Test
  func testArtworkAppliesOnlyWhileItsOwnerIsOnTopWithTheSameURL() throws {
    let first = URL(string: "https://example.com/a.png")!
    let second = URL(string: "https://example.com/b.png")!
    let a = FakeNowPlayingOwner("a", isPlaying: false)
    let b = FakeNowPlayingOwner("b")
    let aClaim = manager.offerNowPlaying(a, info: NowPlayingInfo(title: "A", artworkURL: first), commands: playback)
    let bClaim = manager.offerNowPlaying(b, info: NowPlayingInfo(title: "B"), commands: playback)

    center.loads[0].completion(NowPlayingArtwork(image: UIImage()))
    #expect(center.state?.info.title == "B")
    #expect(center.state?.artwork == nil)

    bClaim.withdraw(.ended)
    #expect(center.loads.count == 2)
    aClaim.update(NowPlayingInfo(title: "A", artworkURL: second))
    #expect(center.loads.count == 3)
    center.loads[1].completion(NowPlayingArtwork(image: UIImage()))
    #expect(center.state?.artwork == nil)

    let artwork = NowPlayingArtwork(image: UIImage())
    center.loads[2].completion(artwork)
    #expect(center.state?.artwork == artwork)
    #expect(center.nowPlayingInfo?[MPMediaItemPropertyArtwork] != nil)

    aClaim.update(NowPlayingInfo(title: "A again", artworkURL: second))
    #expect(center.loads.count == 3)
    #expect(center.state?.artwork == artwork)
  }
}
