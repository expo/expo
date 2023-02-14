import ExpoModulesTestCore

@testable import ExpoModulesCore
@testable import EXFileSystem

class EXFileSystemSpec: ExpoSpec {
  override func spec() {
    let fileSystem = EXFileSystem()

    describe("percentEncodeURIStringAfterScheme") {
      it("should handle encoded URIs") {
        let encodedUriInput = "file:///var/mobile/%40username%2Fbranch"
        let encodedUriExpectedOutput = "file:///var/mobile/@username/branch"
        let encodedUri = fileSystem.percentEncodeURIString(afterScheme:encodedUriInput)

        expect(encodedUri?.absoluteString) == encodedUriExpectedOutput
        expect(encodedUri?.scheme) == "file"
      }

      it("should handle UTF-8 characters") {
        let utf8UriInput = "file:///var/mobile/中文"
        let utf8UriExpectedOutput = "file:///var/mobile/%E4%B8%AD%E6%96%87"
        let utf8Uri = fileSystem.percentEncodeURIString(afterScheme:utf8UriInput)

        expect(utf8Uri?.absoluteString) == utf8UriExpectedOutput
        expect(utf8Uri?.scheme) == "file"
      }

      it("should handle assets-library URIs") {
        let assetsLibraryUriInput = "assets-library://asset/asset.JPG?id=3C1D9C54-9521-488F-BB27-AA1EA0F8AF04/L0/001&ext=JPG"
        let assetsLibraryUri = fileSystem.percentEncodeURIString(afterScheme:assetsLibraryUriInput)

        expect(assetsLibraryUri?.absoluteString) == assetsLibraryUriInput
        expect(assetsLibraryUri?.scheme) == "assets-library"
      }
    }
  }
}
