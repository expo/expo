import ExpoAppMetrics
import Testing

@testable import ExpoObserve

@Suite("DispatchSerializer")
@AppMetricsActor
struct DispatchSerializerTests {
  @Test
  func `runs the work it is given`() async {
    let serializer = DispatchSerializer()
    var ran = false
    await serializer.run {
      ran = true
    }
    #expect(ran)
  }

  @Test
  func `a second caller waits instead of running concurrently`() async {
    // The actor is reentrant at every network `await`, so two overlapping passes would read and
    // send the same pending rows twice. Waiting (rather than skipping) is what lets a JS
    // `dispatchEvents()` promise mean the queue was drained.
    let serializer = DispatchSerializer()
    let tracker = OverlapTracker()
    async let first: Void = serializer.run {
      await tracker.enter()
      await Task.yield()
      await tracker.leave()
    }
    async let second: Void = serializer.run {
      await tracker.enter()
      await Task.yield()
      await tracker.leave()
    }
    _ = await (first, second)
    #expect(await tracker.runCount == 2)
    #expect(await tracker.maxConcurrent == 1)
  }

  @Test
  func `a later caller runs after the one ahead finishes`() async {
    let serializer = DispatchSerializer()
    let tracker = OverlapTracker()
    await serializer.run {
      await tracker.enter()
      await tracker.leave()
    }
    await serializer.run {
      await tracker.enter()
      await tracker.leave()
    }
    #expect(await tracker.runCount == 2)
    #expect(await tracker.maxConcurrent == 1)
  }

  @Test
  func `three overlapping callers each run exactly once, in turn`() async {
    // The chain has to link each caller behind the pass it found. Publishing the new task before
    // awaiting is what makes that work: awaiting first would let all three observe an idle
    // serializer and run together.
    let serializer = DispatchSerializer()
    let tracker = OverlapTracker()
    async let first: Void = serializer.run {
      await tracker.enter()
      await Task.yield()
      await tracker.leave()
    }
    async let second: Void = serializer.run {
      await tracker.enter()
      await Task.yield()
      await tracker.leave()
    }
    async let third: Void = serializer.run {
      await tracker.enter()
      await Task.yield()
      await tracker.leave()
    }
    _ = await (first, second, third)
    #expect(await tracker.runCount == 3)
    #expect(await tracker.maxConcurrent == 1)
  }
}

/// Records how many passes ran and whether any two overlapped.
private actor OverlapTracker {
  private(set) var runCount = 0
  private(set) var maxConcurrent = 0
  private var current = 0

  func enter() {
    runCount += 1
    current += 1
    maxConcurrent = max(maxConcurrent, current)
  }

  func leave() {
    current -= 1
  }
}
