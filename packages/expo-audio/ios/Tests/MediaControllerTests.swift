import CoreMedia
import Testing

@testable import ExpoAudio

@Suite("MediaController")
struct MediaControllerTests {
  @Test(arguments: [0.1, 0.5, 15.5, 30.0])
  func `preserves fractional skip intervals when converting to CMTime`(seconds: Double) {
    let time = MediaController.cmTime(seconds: seconds)
    #expect(abs(time.seconds - seconds) < 0.000_001)
  }

  @Test func `skipping forward and backward keeps sub-second precision`() {
    let current = MediaController.cmTime(seconds: 20.25)
    let forward = current + MediaController.cmTime(seconds: 0.1)
    let backward = current - MediaController.cmTime(seconds: 15.5)

    #expect(abs(forward.seconds - 20.35) < 0.000_001)
    #expect(abs(backward.seconds - 4.75) < 0.000_001)
  }

  @Test func `missing or non-finite skip intervals use the default`() {
    #expect(MediaController.normalizedSkipInterval(nil) == 10)
    #expect(MediaController.normalizedSkipInterval(.nan) == 10)
    #expect(MediaController.normalizedSkipInterval(.infinity) == 10)
    #expect(MediaController.normalizedSkipInterval(-.infinity) == 10)
  }

  @Test(arguments: [0.0, -3.0, 0.05])
  func `skip intervals below the minimum are clamped`(seconds: Double) {
    #expect(MediaController.normalizedSkipInterval(seconds) == 0.1)
  }

  @Test(arguments: [0.1, 15.5, 30.0])
  func `valid skip intervals are kept`(seconds: Double) {
    #expect(MediaController.normalizedSkipInterval(seconds) == seconds)
  }
}
