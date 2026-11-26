import Foundation
import Testing

@testable import ExpoImage

@Suite("ImageView2 frame")
struct ImageView2FrameTests {
  let imageSize = CGSize(width: 300, height: 200)
  let squareContainer = CGSize(width: 150, height: 150)

  private func frame(
    imageSize: CGSize,
    containerSize: CGSize,
    contentFit: ContentFit,
    position: ImageView2ContentPosition? = nil
  ) -> CGRect? {
    return imageView2Frame(imageSize: imageSize, containerSize: containerSize, contentFit: contentFit, contentPosition: position)
  }

  @Test
  func `covers and centers`() {
    #expect(frame(imageSize: imageSize, containerSize: squareContainer, contentFit: .cover) == CGRect(x: -37.5, y: 0, width: 225, height: 150))
  }

  @Test
  func `contains and centers`() {
    #expect(frame(imageSize: imageSize, containerSize: squareContainer, contentFit: .contain) == CGRect(x: 0, y: 25, width: 150, height: 100))
  }

  @Test
  func `fills`() {
    #expect(frame(imageSize: imageSize, containerSize: squareContainer, contentFit: .fill) == CGRect(origin: .zero, size: squareContainer))
  }

  @Test
  func `keeps the image size with none`() {
    let small = CGSize(width: 50, height: 40)
    #expect(frame(imageSize: small, containerSize: CGSize(width: 150, height: 100), contentFit: .none) == CGRect(x: 50, y: 30, width: 50, height: 40))
  }

  @Test
  func `scales down a larger image like contain`() {
    #expect(frame(imageSize: imageSize, containerSize: squareContainer, contentFit: .scaleDown) == CGRect(x: 0, y: 25, width: 150, height: 100))
  }

  @Test
  func `keeps a smaller image size with scale-down`() {
    let small = CGSize(width: 50, height: 40)
    #expect(frame(imageSize: small, containerSize: squareContainer, contentFit: .scaleDown) == CGRect(x: 50, y: 55, width: 50, height: 40))
  }

  @Suite("content position")
  struct ContentPositionTests {
    // The free space is 100 horizontally and 60 vertically.
    let imageSize = CGSize(width: 50, height: 40)
    let containerSize = CGSize(width: 150, height: 100)

    private func origin(_ configure: (inout ImageView2ContentPosition) -> Void) -> CGPoint? {
      var position = ImageView2ContentPosition()
      configure(&position)
      return imageView2Frame(imageSize: imageSize, containerSize: containerSize, contentFit: .none, contentPosition: position)?.origin
    }

    @Test
    func `places the image at a distance from the start edges`() {
      #expect(origin { $0.left = .number(10); $0.top = .number(5) } == CGPoint(x: 10, y: 5))
    }

    @Test
    func `places the image at a distance from the end edges`() {
      #expect(origin { $0.right = .number(10); $0.bottom = .number(5) } == CGPoint(x: 90, y: 55))
    }

    @Test
    func `reads a distance from a string with only a number`() {
      #expect(origin { $0.left = .string("10") } == CGPoint(x: 10, y: 30))
    }

    @Test
    func `places the image at a percentage of the free space`() {
      #expect(origin { $0.left = .string("25%"); $0.bottom = .string("25%") } == CGPoint(x: 25, y: 45))
    }

    @Test
    func `centers the image with the center keyword`() {
      #expect(origin { $0.top = .string("center"); $0.left = .string("center") } == CGPoint(x: 50, y: 30))
    }

    @Test
    func `prefers the start edge when both edges are set`() {
      #expect(origin { $0.left = .number(5); $0.right = .number(5) } == CGPoint(x: 5, y: 30))
    }

    @Test
    func `centers the image for a position that isn't a number`() {
      #expect(origin { $0.left = .number(.nan); $0.top = .string("NaN%") } == CGPoint(x: 50, y: 30))
    }
  }

  @Test
  func `has no frame for an empty image`() {
    #expect(frame(imageSize: .zero, containerSize: squareContainer, contentFit: .cover) == nil)
  }

  @Test
  func `has no frame for an empty container`() {
    #expect(frame(imageSize: imageSize, containerSize: .zero, contentFit: .contain) == nil)
  }
}
