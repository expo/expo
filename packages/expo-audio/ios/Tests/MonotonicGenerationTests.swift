import Testing
import Dispatch

@testable import ExpoAudio

@Suite("MonotonicGeneration")
struct MonotonicGenerationTests {
  @Test
  func capturedValueStaysCurrentUntilBumped() {
    let generation = MonotonicGeneration()
    let captured = generation.current
    // A queued operation whose generation is still current must run.
    #expect(captured == generation.current)
  }

  @Test
  func bumpSupersedesCapturedValue() {
    let generation = MonotonicGeneration()
    let captured = generation.current
    generation.bump()
    // A queued operation captured before the bump must detect it is stale:
    // this is the play-then-pause ordering (queued play must not start), and
    // equally the deactivate-then-activate ordering (stale deactivation must
    // not tear down the reactivated session).
    #expect(captured != generation.current)
  }

  @Test
  func laterCaptureIsUnaffectedByEarlierBumps() {
    let generation = MonotonicGeneration()
    generation.bump()
    let captured = generation.current
    // pause-then-play: the later play's capture must still be current.
    #expect(captured == generation.current)
  }

  @Test
  func concurrentBumpsAreLossless() {
    let generation = MonotonicGeneration()
    let iterations = 1_000
    DispatchQueue.concurrentPerform(iterations: iterations) { _ in
      generation.bump()
    }
    #expect(generation.current == iterations)
  }
}
