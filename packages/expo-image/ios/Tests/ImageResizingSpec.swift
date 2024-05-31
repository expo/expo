import ExpoModulesTestCore

@testable import ExpoModulesCore
@testable import ExpoImage

class ImageResizingSpec: ExpoSpec {
  override class func spec() {
    describe("ideal size") {
      // For simplicity use the same container size for all tests
      let containerSize = CGSize(width: 150, height: 100)

      context("content size is 300x200") {
        let contentSize = CGSize(width: 300, height: 200)
        let aspectRatio = contentSize.width / contentSize.height

        it("contains") {
          let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .contain)
          expect(size.width) == containerSize.width       // 150
          expect(size.height) == containerSize.height     // 100
          expect(size.width / size.height) == aspectRatio // 1.5
        }

        it("covers") {
          let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .cover)
          expect(size.width) == containerSize.width       // 150
          expect(size.height) == containerSize.height     // 100
          expect(size.width / size.height) == aspectRatio // 1.5
        }

        it("fills") {
          let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .fill)
          expect(size.width) == containerSize.width   // 150
          expect(size.height) == containerSize.height // 100
        }

        it("scales down") {
          // Behaves like 'contain' content fit
          let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .scaleDown)
          expect(size.width) == containerSize.width       // 150
          expect(size.height) == containerSize.height     // 100
          expect(size.width / size.height) == aspectRatio // 1.5
        }

        it("doesn't resize") {
          let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .none)
          expect(size.width) == contentSize.width   // 300
          expect(size.height) == contentSize.height // 200
        }
      }

      context("content size is 168x412") {
        let contentSize = CGSize(width: 168, height: 412)
        let aspectRatio = contentSize.width / contentSize.height

        it("contains") {
          let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .contain)
          expect(size.width) == (expected: containerSize.height * aspectRatio, delta: 0.0001) // ~40.77
          expect(size.height) == containerSize.height                                         // 100
          expect(size.width / size.height) == (expected: aspectRatio, delta: 0.0001)          // ~0.40
        }

        it("covers") {
          let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .cover)
          expect(size.width) == containerSize.width                                           // 150
          expect(size.height) == (expected: containerSize.width / aspectRatio, delta: 0.0001) // ~367.85
          expect(size.width / size.height) == aspectRatio                                     // ~0.40
        }

        it("fills") {
          let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .fill)
          expect(size.width) == containerSize.width   // 150
          expect(size.height) == containerSize.height // 100
        }

        it("scales down") {
          // Behaves like 'contain' content fit
          let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .scaleDown)
          expect(size.width) == (expected: containerSize.height * aspectRatio, delta: 0.0001) // ~40.77
          expect(size.height) == containerSize.height                                         // 100
          expect(size.width / size.height) == (expected: aspectRatio, delta: 0.0001)          // ~0.40
        }

        it("doesn't resize") {
          let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .none)
          expect(size.width) == contentSize.width   // 168
          expect(size.height) == contentSize.height // 412
        }
      }

      context("content size is 37x21") {
        let contentSize = CGSize(width: 37, height: 21)
        let aspectRatio = contentSize.width / contentSize.height

        it("contains") {
          let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .contain)
          expect(size.width) == containerSize.width                                           // 150
          expect(size.height) == (expected: containerSize.width / aspectRatio, delta: 0.0001) // ~85.13
          expect(size.width / size.height) == (expected: aspectRatio, delta: 0.0001)          // ~1.76
        }

        it("covers") {
          let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .cover)
          expect(size.width) == containerSize.height * aspectRatio // ~176.19
          expect(size.height) == containerSize.height              // 100
          expect(size.width / size.height) == aspectRatio          // ~1.76
        }

        it("fills") {
          let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .fill)
          expect(size.width) == containerSize.width   // 150
          expect(size.height) == containerSize.height // 100
        }

        it("scales down") {
          // Behaves like `none` content fit
          let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .scaleDown)
          expect(size.width) == contentSize.width         // 37
          expect(size.height) == contentSize.height       // 21
          expect(size.width / size.height) == aspectRatio // ~1.76
        }

        it("doesn't resize") {
          let size = idealSize(contentPixelSize: contentSize, containerSize: containerSize, contentFit: .none)
          expect(size.width) == contentSize.width   // 37
          expect(size.height) == contentSize.height // 21
        }
      }
    }
  }
}
