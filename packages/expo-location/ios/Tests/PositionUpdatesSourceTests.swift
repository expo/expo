import CoreLocation
import Testing

@testable import ExpoLocation

@Suite("PositionUpdatesSource")
struct PositionUpdatesSourceTests {
  @Test
  func `stop finishes the stream and cleans up only once`() async throws {
    let (stream, continuation) = AsyncThrowingStream.makeStream(of: CLLocation?.self)
    var stops = 0
    let source = PositionUpdatesSource(stream: stream, continuation: continuation) {
      stops += 1
    }

    source.stop()
    source.stop()
    continuation.finish()

    #expect(stops == 1)
    var iterator = stream.makeAsyncIterator()
    #expect(try await iterator.next() == nil)
  }

  @Test
  func `natural completion shares the same cleanup as stop`() {
    let (stream, continuation) = AsyncThrowingStream.makeStream(of: CLLocation?.self)
    var stops = 0
    let source = PositionUpdatesSource(stream: stream, continuation: continuation) {
      stops += 1
    }

    continuation.finish()
    source.stop()

    #expect(stops == 1)
  }

  @Test
  func `consumer cancellation still cleans up the source`() async {
    let (stream, continuation) = AsyncThrowingStream.makeStream(of: CLLocation?.self)
    var stops = 0
    let source = PositionUpdatesSource(stream: stream, continuation: continuation) {
      stops += 1
    }
    let consumer = Task {
      for try await _ in stream {}
    }

    consumer.cancel()
    _ = await consumer.result
    source.stop()

    #expect(stops == 1)
  }

  @Test
  func `discarding a stream retains termination cleanup`() {
    var stops = 0
    func openAndDiscard() {
      let (stream, continuation) = AsyncThrowingStream.makeStream(of: CLLocation?.self)
      _ = PositionUpdatesSource(stream: stream, continuation: continuation) {
        stops += 1
      }
    }

    openAndDiscard()

    #expect(stops == 1)
  }
}
