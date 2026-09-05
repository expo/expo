import ExpoModulesCore
import Foundation
import ImageIO
internal import SDWebImage
import Testing
import UniformTypeIdentifiers

@testable import ExpoImage

// MARK: - Fixtures

// An animated image whose frames are declared instead of decoded, so the schedule can be shaped per test.
private final class StubAnimatedImage: SDAnimatedImage, @unchecked Sendable {
  private var durations: [TimeInterval] = []
  private var pixelSize = CGSize(width: 2, height: 2)

  convenience init(durations: [TimeInterval], pixelSize: CGSize = CGSize(width: 2, height: 2)) {
    self.init()
    self.durations = durations
    self.pixelSize = pixelSize
  }

  override var animatedImageFrameCount: UInt {
    return UInt(durations.count)
  }

  override func animatedImageDuration(at index: UInt) -> TimeInterval {
    return durations[Int(index)]
  }

  override var size: CGSize {
    return pixelSize
  }

  override var scale: CGFloat {
    return 1
  }
}

/**
 * A decoded GIF that reports a single loop.
 */
private final class FiniteLoopAnimatedImage: SDAnimatedImage, @unchecked Sendable {
  override var animatedImageLoopCount: UInt {
    return 1
  }
}

/**
 * Encodes a real GIF with one solid frame per duration.
 */
private func makeGIF(frameDurations: [TimeInterval], size: CGSize = CGSize(width: 4, height: 4)) -> Data {
  let data = NSMutableData()
  guard
    let destination = CGImageDestinationCreateWithData(
      data,
      UTType.gif.identifier as CFString,
      frameDurations.count,
      nil
    )
  else {
    fatalError("Couldn't create a GIF destination")
  }
  CGImageDestinationSetProperties(
    destination,
    [
      kCGImagePropertyGIFDictionary: [kCGImagePropertyGIFLoopCount: 0]
    ] as CFDictionary
  )

  let renderer = UIGraphicsImageRenderer(size: size)
  for (index, duration) in frameDurations.enumerated() {
    let image = renderer.image { context in
      UIColor(hue: CGFloat(index) / CGFloat(frameDurations.count), saturation: 1, brightness: 1, alpha: 1).setFill()
      context.fill(CGRect(origin: .zero, size: size))
    }
    guard let cgImage = image.cgImage else {
      fatalError("Couldn't render a GIF frame")
    }
    CGImageDestinationAddImage(
      destination,
      cgImage,
      [
        kCGImagePropertyGIFDictionary: [kCGImagePropertyGIFDelayTime: duration]
      ] as CFDictionary
    )
  }
  CGImageDestinationFinalize(destination)
  return data as Data
}

private func makeAnimatedImage(frameDurations: [TimeInterval] = [0.1, 0.2, 0.3]) -> AnimatedImage {
  guard let image = AnimatedImage(data: makeGIF(frameDurations: frameDurations)) else {
    fatalError("SDWebImage couldn't decode the generated GIF")
  }
  return image
}

@MainActor
private func waitUntil(timeout: TimeInterval = 5, _ condition: () -> Bool) async throws {
  let deadline = Date().addingTimeInterval(timeout)
  while !condition() {
    try #require(Date() < deadline, "Timed out waiting for the condition")
    try await Task.sleep(nanoseconds: 10_000_000)
  }
}

// MARK: - AnimationTimeline

@Suite("animation timeline")
struct AnimationTimelineTests {
  @Test
  func `is nil for a single frame image`() {
    #expect(AnimationTimeline(image: StubAnimatedImage(durations: [0.5])) == nil)
  }

  @Test
  func `is nil for an image without frames`() {
    #expect(AnimationTimeline(image: StubAnimatedImage(durations: [])) == nil)
  }

  @Test
  func `is nil when every frame has no duration`() {
    #expect(AnimationTimeline(image: StubAnimatedImage(durations: [0, 0, 0])) == nil)
  }

  @Test
  func `sums the frame durations`() throws {
    let timeline = try #require(AnimationTimeline(image: StubAnimatedImage(durations: [0.1, 0.2, 0.3])))
    #expect(timeline.frameCount == 3)
    #expect(abs(timeline.totalDuration - 0.6) < 0.0001)
  }

  @Test
  func `ignores negative durations`() throws {
    let timeline = try #require(AnimationTimeline(image: StubAnimatedImage(durations: [-1, 0.5])))
    #expect(timeline.totalDuration == 0.5)
  }

  @Test
  func `starts on the first frame`() throws {
    let timeline = try #require(AnimationTimeline(image: StubAnimatedImage(durations: [0.1, 0.2, 0.3])))
    #expect(timeline.frameIndex(atElapsed: 0) == 0)
    #expect(timeline.frameIndex(atElapsed: -1) == 0)
    #expect(timeline.frameIndex(atElapsed: 0.05) == 0)
  }

  @Test
  func `advances when a frame ends`() throws {
    // Durations that add up exactly in binary, so the boundaries are not subject to rounding.
    let timeline = try #require(AnimationTimeline(image: StubAnimatedImage(durations: [0.25, 0.5, 0.25])))
    #expect(timeline.frameIndex(atElapsed: 0.25) == 1)
    #expect(timeline.frameIndex(atElapsed: 0.5) == 1)
    #expect(timeline.frameIndex(atElapsed: 0.75) == 2)
    #expect(timeline.frameIndex(atElapsed: 0.99) == 2)
  }

  @Test
  func `loops forever`() throws {
    let timeline = try #require(AnimationTimeline(image: StubAnimatedImage(durations: [0.25, 0.5, 0.25])))
    #expect(timeline.frameIndex(atElapsed: 1) == 0)
    #expect(timeline.frameIndex(atElapsed: 1.1) == 0)
    #expect(timeline.frameIndex(atElapsed: 2.3) == 1)
    #expect(timeline.frameIndex(atElapsed: 100.8) == 2)
  }

  @Test
  func `skips over frames without duration`() throws {
    let timeline = try #require(AnimationTimeline(image: StubAnimatedImage(durations: [0, 0.1, 0])))
    #expect(timeline.frameIndex(atElapsed: 0) == 0)
    #expect(timeline.frameIndex(atElapsed: 0.05) == 1)
  }

  @Test
  func `reads the schedule of a decoded GIF`() throws {
    let timeline = try #require(AnimationTimeline(image: makeAnimatedImage(frameDurations: [0.1, 0.2, 0.3])))
    #expect(timeline.frameCount == 3)
    #expect(abs(timeline.totalDuration - 0.6) < 0.0001)
    #expect(timeline.frameIndex(atElapsed: 0.15) == 1)
  }
}

// MARK: - AnimatedImage

@Suite("animated image")
struct AnimatedImageTests {
  @Test
  func `exposes every decoded frame`() {
    let image = makeAnimatedImage(frameDurations: [0.1, 0.2, 0.3])
    #expect(image.images?.count == 3)
    #expect(abs(image.duration - 0.6) < 0.0001)
  }

  @Test
  func `has no frames when it is not animated`() {
    #expect(makeAnimatedImage(frameDurations: [0.5]).images == nil)
  }

  @Test
  func `is reported as animated by the shared ref`() {
    #expect(Image(makeAnimatedImage()).isAnimated)
    #expect(!Image(makeAnimatedImage(frameDurations: [0.5])).isAnimated)
    #expect(!Image(UIImage()).isAnimated)
  }
}

// MARK: - SharedAnimationDriver

@Suite("shared animation driver", .serialized)
@MainActor
struct SharedAnimationDriverTests {
  let driver = SharedAnimationDriver.shared

  @Test
  func `drives small multi-frame images only`() {
    #expect(driver.canDrive(makeAnimatedImage()))
    #expect(!driver.canDrive(StubAnimatedImage(durations: [0.5])))

    let oversized = StubAnimatedImage(
      durations: Array(repeating: 0.1, count: 200),
      pixelSize: CGSize(width: 1000, height: 1000)
    )
    #expect(!driver.canDrive(oversized))
  }

  @Test
  func `caches the timeline on the image`() throws {
    let image = makeAnimatedImage()
    #expect(image.sharedAnimationTimeline == nil)

    let timeline = try #require(driver.timeline(for: image))
    #expect(image.sharedAnimationTimeline?.frameCount == timeline.frameCount)
    #expect(driver.timeline(for: image)?.totalDuration == timeline.totalDuration)
  }

  @Test
  func `has no timeline for images it cannot drive`() {
    #expect(driver.timeline(for: StubAnimatedImage(durations: [0.5])) == nil)
  }

  @Test
  func `decodes the frames once a view registers`() async throws {
    let image = makeAnimatedImage()
    let view = ImageView(appContext: AppContext())
    #expect(!driver.isReady(image))

    #expect(driver.register(view, image: image))
    try await waitUntil { driver.isReady(image) }
    #expect(image.isAllFramesLoaded)

    driver.unregister(view)
    #expect(!driver.isReady(image))
  }

  @Test
  func `keeps the frames while any view is registered`() async throws {
    let image = makeAnimatedImage()
    let first = ImageView(appContext: AppContext())
    let second = ImageView(appContext: AppContext())

    driver.register(first, image: image)
    driver.register(second, image: image)
    try await waitUntil { driver.isReady(image) }

    driver.unregister(first)
    #expect(driver.isReady(image))

    driver.unregister(second)
    #expect(!driver.isReady(image))
  }

  @Test
  func `moves a view between images`() async throws {
    let first = makeAnimatedImage(frameDurations: [0.1, 0.1])
    let second = makeAnimatedImage(frameDurations: [0.2, 0.2])
    let view = ImageView(appContext: AppContext())

    driver.register(view, image: first)
    try await waitUntil { driver.isReady(first) }

    driver.register(view, image: second)
    #expect(!driver.isReady(first))
    try await waitUntil { driver.isReady(second) }

    driver.unregister(view)
  }

  @Test
  func `refuses images over the frame budget`() {
    let view = ImageView(appContext: AppContext())
    let oversized = StubAnimatedImage(
      durations: Array(repeating: 0.1, count: 200),
      pixelSize: CGSize(width: 1000, height: 1000)
    )

    #expect(!driver.register(view, image: oversized))
    #expect(!driver.isReady(oversized))
  }

  @Test
  func `ignores unregistering a view that never joined`() {
    driver.unregister(ImageView(appContext: AppContext()))
  }
}

// MARK: - ImageView

@Suite("image view shared animation", .serialized)
@MainActor
struct ImageViewSharedAnimationTests {
  private func displayedView(_ image: UIImage) -> ImageView {
    let view = ImageView(appContext: AppContext())
    view.sourceImage = image
    view.sdImageView.image = image
    return view
  }

  @Test
  func `joins the shared clock when the prop turns on`() async throws {
    let image = makeAnimatedImage()
    let view = displayedView(image)
    #expect(!view.hasSharedAnimation)

    view.synchronizedAnimation = true

    #expect(view.hasSharedAnimation)
    #expect(!view.sdImageView.autoPlayAnimatedImage)
    try await waitUntil { SharedAnimationDriver.shared.isReady(image) }

    view.leaveSharedAnimation()
  }

  @Test
  func `hands the view back to its own player when the prop turns off`() {
    let image = makeAnimatedImage()
    let view = displayedView(image)
    view.synchronizedAnimation = true
    #expect(view.hasSharedAnimation)

    view.synchronizedAnimation = false

    #expect(!view.hasSharedAnimation)
    #expect(view.sdImageView.autoPlayAnimatedImage)
    #expect(!SharedAnimationDriver.shared.isReady(image))
  }

  @Test
  func `leaves the shared clock when it is recycled`() {
    let image = makeAnimatedImage()
    let view = displayedView(image)
    view.recyclingKey = "first"
    view.synchronizedAnimation = true
    #expect(view.hasSharedAnimation)

    view.recyclingKey = "second"

    #expect(!view.hasSharedAnimation)
    #expect(view.sdImageView.image == nil)
  }

  @Test
  func `stays on its own player for still images`() {
    let view = displayedView(UIImage())
    view.synchronizedAnimation = true
    #expect(!view.hasSharedAnimation)
  }

  @Test
  func `stays on its own player for tinted images`() {
    let view = displayedView(makeAnimatedImage())
    view.imageTintColor = .red
    view.synchronizedAnimation = true
    #expect(!view.hasSharedAnimation)
  }

  @Test
  func `stays on its own player for images that do not loop`() throws {
    let image = try #require(FiniteLoopAnimatedImage(data: makeGIF(frameDurations: [0.1, 0.2])))
    let view = displayedView(image)
    view.synchronizedAnimation = true
    #expect(!view.hasSharedAnimation)
  }

  @Test
  func `stops and starts on the shared clock`() async throws {
    let image = makeAnimatedImage()
    let view = displayedView(image)
    view.synchronizedAnimation = true
    try await waitUntil { SharedAnimationDriver.shared.isReady(image) }

    view.stopSharedAnimation()
    #expect(view.hasSharedAnimation)
    #expect(!SharedAnimationDriver.shared.isReady(image))

    view.startSharedAnimation()
    try await waitUntil { SharedAnimationDriver.shared.isReady(image) }

    view.leaveSharedAnimation()
  }
}
