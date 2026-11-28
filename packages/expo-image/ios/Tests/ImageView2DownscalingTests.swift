import Foundation
import Testing

@testable import ExpoImage

@Suite("ImageView2 downscaling")
struct ImageView2DownscalingTests {
  @Suite("downscale size")
  struct DownscaleSizeTests {
    // A 4000x3000 px image with scale 1, in a 100x100 pt view on a 3x screen.
    let largeImage = CGSize(width: 4000, height: 3000)
    let squareContainer = CGSize(width: 100, height: 100)

    @Test
    func `downscales a large image to the cover size, rounded to whole pixels`() {
      let size = imageView2DownscaleSize(
        imageSize: largeImage, imageScale: 1, containerSize: squareContainer, screenScale: 3, contentFit: .cover
      )
      #expect(size == CGSize(width: 400.0 / 3, height: 100))
    }

    @Test
    func `keeps the aspect ratio of the image when it downscales`() throws {
      // The cover size is 101x1.01 pt. Rounded up to whole points, it would be 101x2 pt.
      let size = try #require(imageView2DownscaleSize(
        imageSize: CGSize(width: 1200, height: 12), imageScale: 1, containerSize: CGSize(width: 101, height: 1),
        screenScale: 3, contentFit: .cover
      ))
      #expect(abs(size.width / size.height - 100) < 2)
    }

    @Test
    func `downscales a large image to the contain size`() {
      let size = imageView2DownscaleSize(
        imageSize: largeImage, imageScale: 1, containerSize: squareContainer, screenScale: 3, contentFit: .contain
      )
      #expect(size == CGSize(width: 100, height: 75))
    }

    @Test
    func `downscales a large image to the container size with fill`() {
      let size = imageView2DownscaleSize(
        imageSize: largeImage, imageScale: 1, containerSize: CGSize(width: 100, height: 50), screenScale: 3,
        contentFit: .fill
      )
      #expect(size == CGSize(width: 100, height: 50))
    }

    @Test
    func `keeps an image that doesn't have more pixels than the view shows`() {
      // The view shows 150x100 pt, which is 450x300 px on a 3x screen.
      let size = imageView2DownscaleSize(
        imageSize: CGSize(width: 300, height: 200), imageScale: 1, containerSize: CGSize(width: 150, height: 100),
        screenScale: 3, contentFit: .cover
      )
      #expect(size == nil)
    }

    @Test
    func `keeps an image with none when its scale is the screen scale`() {
      // 300x200 pt with scale 3 is shown at 300x200 pt, which is all of its 900x600 px.
      let size = imageView2DownscaleSize(
        imageSize: CGSize(width: 300, height: 200), imageScale: 3, containerSize: squareContainer, screenScale: 3,
        contentFit: .none
      )
      #expect(size == nil)
    }

    @Test
    func `keeps an image in an empty view`() {
      let size = imageView2DownscaleSize(
        imageSize: largeImage, imageScale: 1, containerSize: .zero, screenScale: 3, contentFit: .cover
      )
      #expect(size == nil)
    }
  }

  @Suite("redecode")
  struct RedecodeTests {
    let downscaled = ImageView2Downscaling(size: CGSize(width: 134, height: 100), contentFit: .cover)

    @Test
    func `doesn't redecode an image that was displayed as it was loaded`() {
      #expect(!imageView2NeedsRedecode(current: nil, targetSize: CGSize(width: 50, height: 50), contentFit: .cover))
    }

    @Test
    func `doesn't redecode for a smaller size`() {
      #expect(!imageView2NeedsRedecode(current: downscaled, targetSize: CGSize(width: 67, height: 50), contentFit: .cover))
    }

    @Test
    func `doesn't redecode for a size within a point`() {
      #expect(!imageView2NeedsRedecode(current: downscaled, targetSize: CGSize(width: 135, height: 100), contentFit: .cover))
    }

    @Test
    func `redecodes for a larger size`() {
      #expect(imageView2NeedsRedecode(current: downscaled, targetSize: CGSize(width: 268, height: 200), contentFit: .cover))
    }

    @Test
    func `redecodes when the whole image is needed`() {
      #expect(imageView2NeedsRedecode(current: downscaled, targetSize: nil, contentFit: .cover))
    }

    @Test
    func `redecodes an image stretched for fill when the content fit changes`() {
      let stretched = ImageView2Downscaling(size: CGSize(width: 100, height: 50), contentFit: .fill)
      #expect(imageView2NeedsRedecode(current: stretched, targetSize: CGSize(width: 67, height: 50), contentFit: .contain))
    }
  }
}
