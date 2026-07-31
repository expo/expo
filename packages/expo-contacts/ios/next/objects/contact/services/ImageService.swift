import Foundation
import Contacts
import ExpoModulesCore

// Images cannot be easily converted from DTO to domain
// because the operations require access to the file system.
class ImageService {
  let appContext: AppContext?

  init(appContext: AppContext?) {
    self.appContext = appContext
  }

  func url(from imageData: Data, filename: String) throws -> String {
    let imageFileURL = try prepareCacheFileURL(filename: filename)
    try imageData.write(to: imageFileURL, options: .atomic)
    // The API contract is a URI (see the `file:///path/to/image.jpg` examples in the types, and
    // Android returning `content://` URIs), so return one instead of a bare filesystem path.
    return imageFileURL.absoluteString
  }

  func imageData(from url: String) throws -> Data? {
    guard let url = URL(string: url), url.isFileURL else {
      throw RemoteImageUriException(url)
    }
    guard FileSystemUtilities.isReadableFile(appContext, url.standardized) else {
      throw FailedToOpenImageException()
    }
    guard let image = UIImage(contentsOfFile: url.path) else {
      throw FailedToOpenImageException()
    }

    return image.pngData()
  }

  private func prepareCacheFileURL(filename: String) throws -> URL {
    guard let baseDirectoryURL = appContext?.config.cacheDirectory?.appendingPathComponent("Contacts") else {
      throw FailedToCacheContactImage("Failed to create a cache directory for contacts")
    }
    guard FileSystemUtilities.ensureDirExists(at: baseDirectoryURL) else {
      throw FailedToCacheContactImage("The contacts cache directory does not exist")
    }
    // Contact identifiers can contain "/" (e.g. "com.apple.introductions.accepted/494"), which
    // `appendingPathComponent` would treat as a nested directory that doesn't exist.
    return baseDirectoryURL.appendingPathComponent(filename.replacingOccurrences(of: "/", with: "_"))
  }
}
