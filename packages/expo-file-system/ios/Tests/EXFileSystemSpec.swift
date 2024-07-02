import ExpoModulesTestCore

@testable import ExpoModulesCore
@testable import ExpoFileSystem

class EXFileSystemSpec: ExpoSpec {
  override class func spec() {
    let fileSystem = EXFileSystem()

    describe("percentEncodedURLFromURIString") {
      it("should handle encoded URIs") {
        let encodedUriInput = "file:///var/mobile/@username/branch"
        let encodedUriExpectedOutput = "file:///var/mobile/@username/branch"
        let encodedUri = fileSystem.percentEncodedURL(fromURIString: encodedUriInput)

        expect(encodedUri?.absoluteString) == encodedUriExpectedOutput
        expect(encodedUri?.scheme) == "file"
      }

      it("should handle UTF-8 characters") {
        let utf8UriInput = "file:///var/mobile/中文"
        let utf8UriExpectedOutput = "file:///var/mobile/%E4%B8%AD%E6%96%87"
        let utf8Uri = fileSystem.percentEncodedURL(fromURIString: utf8UriInput)

        expect(utf8Uri?.absoluteString) == utf8UriExpectedOutput
        expect(utf8Uri?.scheme) == "file"
      }

      it("should handle URI with percent, numbers and UTF-8 characters") {
        let input = "file:///document/directory/%40%2F中文"
        let expectedOutput = "file:///document/directory/%40%2F%E4%B8%AD%E6%96%87"
        let uri = fileSystem.percentEncodedURL(fromURIString: input)

        expect(uri?.absoluteString) == expectedOutput
      }

      it("should not decode percentages in URI") {
        let input = "file:///document/hello%2Fworld.txt"
        let unexpectedOutput = "file:///document/hello/world.txt"
        let uri = fileSystem.percentEncodedURL(fromURIString: input)

        // Should not create a directory named "hello"
        expect(uri?.absoluteString) != unexpectedOutput
      }

      it("should handle assets-library URIs") {
        let assetsLibraryUriInput = "assets-library://asset/asset.JPG?id=3C1D9C54-9521-488F-BB27-AA1EA0F8AF04/L0/001&ext=JPG"
        let assetsLibraryUri = fileSystem.percentEncodedURL(fromURIString: assetsLibraryUriInput)

        expect(assetsLibraryUri?.absoluteString) == assetsLibraryUriInput
        expect(assetsLibraryUri?.scheme) == "assets-library"
      }
    }

    describe("appendFile") {
      let filePath = fileSystem.documentDirectory + "test.txt"
      let initialContent = "Initial content\n"
      let appendContent = "Additional content\n"

      beforeEach {
        // Setup: Write initial content to the file
        try? fileSystem.writeAsStringAsync(path: filePath, string: initialContent)
      }

      afterEach {
        // Teardown: Delete the file after each test
        try? fileSystem.deleteAsync(path: filePath)
      }

      it("appends content to an existing file") {
        do {
          // Test appending content to an existing file
          try fileSystem.appendAsStringAsync(path: filePath, string: appendContent)

          // Verify: Read the file and check if the content matches the expected result
          let fileContents = try fileSystem.readAsStringAsync(path: filePath)
          expect(fileContents).to(equal(initialContent + appendContent))
        } catch {
          fail("Failed to append content to file: \(error)")
        }
      }

      it("creates a new file if it doesn't exist") {
        let newFilePath = fileSystem.documentDirectory + "newFile.txt"

        do {
          // Test appending content to a new file
          try fileSystem.appendAsStringAsync(path: newFilePath, string: appendContent)

          // Verify: Read the new file and check if the content matches the appended content
          let newFileContents = try fileSystem.readAsStringAsync(path: newFilePath)
          expect(newFileContents).to(equal(appendContent))
        } catch {
          fail("Failed to create and append content to new file: \(error)")
        }
      }

      it("throws an error if trying to append to a directory") {
        let directoryPath = fileSystem.documentDirectory

        // Test appending to a directory should throw an error
        expect { try fileSystem.appendAsStringAsync(path: directoryPath, string: appendContent) }.to(throwError())
      }
  }
}
