import Foundation
import Testing

@testable import ExpoImage

@Suite("ideal size")
struct ImageResizingTests {
  @Suite("content size is 300x200")
  struct ContentSize300x200Tests {
    let containerSize = CGSize(width: 150, height: 100)
    let contentSize = CGSize(width: 300, height: 200)
    var aspectRatio: CGFloat { contentSize.width / contentSize.height }

    @Test
    func `contains`() {
      let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .contain)
      #expect(size.width == containerSize.width)       // 150
      #expect(size.height == containerSize.height)     // 100
      #expect(size.width / size.height == aspectRatio) // 1.5
    }

    @Test
    func `covers`() {
      let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .cover)
      #expect(size.width == containerSize.width)       // 150
      #expect(size.height == containerSize.height)     // 100
      #expect(size.width / size.height == aspectRatio) // 1.5
    }

    @Test
    func `fills`() {
      let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .fill)
      #expect(size.width == containerSize.width)   // 150
      #expect(size.height == containerSize.height) // 100
    }

    @Test
    func `scales down`() {
      // Behaves like 'contain' content fit
      let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .scaleDown)
      #expect(size.width == containerSize.width)       // 150
      #expect(size.height == containerSize.height)     // 100
      #expect(size.width / size.height == aspectRatio) // 1.5
    }

    @Test
    func `doesn't resize`() {
      let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .none)
      #expect(size.width == contentSize.width)   // 300
      #expect(size.height == contentSize.height) // 200
    }
  }

  @Suite("content size is 168x412")
  struct ContentSize168x412Tests {
    let containerSize = CGSize(width: 150, height: 100)
    let contentSize = CGSize(width: 168, height: 412)
    var aspectRatio: CGFloat { contentSize.width / contentSize.height }

    @Test
    func `contains`() {
      let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .contain)
      #expect(abs(size.width - containerSize.height * aspectRatio) <= 0.0001) // ~40.77
      #expect(size.height == containerSize.height)                            // 100
      #expect(abs(size.width / size.height - aspectRatio) <= 0.0001)          // ~0.40
    }

    @Test
    func `covers`() {
      let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .cover)
      #expect(size.width == containerSize.width)                              // 150
      #expect(abs(size.height - containerSize.width / aspectRatio) <= 0.0001) // ~367.85
      #expect(size.width / size.height == aspectRatio)                        // ~0.40
    }

    @Test
    func `fills`() {
      let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .fill)
      #expect(size.width == containerSize.width)   // 150
      #expect(size.height == containerSize.height) // 100
    }

    @Test
    func `scales down`() {
      // Behaves like 'contain' content fit
      let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .scaleDown)
      #expect(abs(size.width - containerSize.height * aspectRatio) <= 0.0001) // ~40.77
      #expect(size.height == containerSize.height)                            // 100
      #expect(abs(size.width / size.height - aspectRatio) <= 0.0001)          // ~0.40
    }

    @Test
    func `doesn't resize`() {
      let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .none)
      #expect(size.width == contentSize.width)   // 168
      #expect(size.height == contentSize.height) // 412
    }
  }

  @Suite("content size is 37x21")
  struct ContentSize37x21Tests {
    let containerSize = CGSize(width: 150, height: 100)
    let contentSize = CGSize(width: 37, height: 21)
    var aspectRatio: CGFloat { contentSize.width / contentSize.height }

    @Test
    func `contains`() {
      let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .contain)
      #expect(size.width == containerSize.width)                              // 150
      #expect(abs(size.height - containerSize.width / aspectRatio) <= 0.0001) // ~85.13
      #expect(abs(size.width / size.height - aspectRatio) <= 0.0001)          // ~1.76
    }

    @Test
    func `covers`() {
      let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .cover)
      #expect(size.width == containerSize.height * aspectRatio) // ~176.19
      #expect(size.height == containerSize.height)              // 100
      #expect(size.width / size.height == aspectRatio)          // ~1.76
    }

    @Test
    func `fills`() {
      let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .fill)
      #expect(size.width == containerSize.width)   // 150
      #expect(size.height == containerSize.height) // 100
    }

    @Test
    func `scales down`() {
      // Behaves like `none` content fit
      let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .scaleDown)
      #expect(size.width == contentSize.width)         // 37
      #expect(size.height == contentSize.height)       // 21
      #expect(size.width / size.height == aspectRatio) // ~1.76
    }

    @Test
    func `doesn't resize`() {
      let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .none)
      #expect(size.width == contentSize.width)   // 37
      #expect(size.height == contentSize.height) // 21
    }
  }
}

@Suite("local asset names")
struct LocalAssetNamesTests {
  @Test
  func `preserves relative asset names`() {
    #expect(localAssetName(from: URL(string: "app_icon")) == "app_icon")
  }

  @Test
  func `removes a leading slash from absolute paths`() {
    #expect(localAssetName(from: URL(string: "/app_icon")) == "app_icon")
  }

  @Test
  func `handles file URLs produced by ExpoModulesCore for scheme-less JS strings`() {
    // `ExpoModulesCore`'s `convertToUrl` wraps scheme-less JS strings via
    // `URL(fileURLWithPath:)`, which is how asset names actually reach the native side.
    #expect(localAssetName(from: URL(fileURLWithPath: "app_icon")) == "app_icon")
    #expect(localAssetName(from: URL(fileURLWithPath: "/app_icon")) == "app_icon")
    #expect(localAssetName(from: URL(fileURLWithPath: "Images/MyIcon")) == "Images/MyIcon")
  }

  @Test
  func `ignores urls with a scheme`() {
    #expect(localAssetName(from: URL(string: "https://example.com/app_icon.png")) == nil)
    #expect(localAssetName(from: URL(string: "sf:/star")) == nil)
  }
}
