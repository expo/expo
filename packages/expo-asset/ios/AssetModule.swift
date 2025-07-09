import ExpoModulesCore
import CryptoKit

internal final class UnableToDownloadAssetException: GenericException<URL> {
  override var reason: String {
    "Unable to download asset from url: '\(param.absoluteString)'"
  }
}

internal final class UnableToSaveAssetToDirectoryException: GenericException<URL> {
  override var reason: String {
    "Unable to save asset to directory: '\(param.absoluteString)'"
  }
}

public class AssetModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoAsset")

    // NOTE: this is exposed in JS as globalThis.expo.modules.ExpoAsset.downloadAsync
    // and potentially consumed outside of Expo (e.g. RN vector icons)
    // do NOT change the function signature as it'll break consumers!
    AsyncFunction("downloadAsync") { (url: URL, md5Hash: String?, type: String, promise: Promise) in
      if url.isFileURL {
        promise.resolve(url.standardizedFileURL.absoluteString)
        return
      }
      guard let cacheFileId = md5Hash ?? getMD5Hash(fromURL: url),
      let cachesDirectory = appContext?.fileSystem?.cachesDirectory,
      let appContext = appContext else {
        promise.reject(UnableToDownloadAssetException(url))
        return
      }

      let localUrl = URL(fileURLWithPath: "\(cachesDirectory)/ExponentAsset-\(cacheFileId).\(type)")

      guard let fileData = FileManager.default.contents(atPath: localUrl.path) else {
        downloadAsset(appContext: appContext, url: url, localUrl: localUrl, promise: promise)
        return
      }
      if md5Hash == nil || md5Hash == getMD5Hash(fromData: fileData) {
        promise.resolve(localUrl.standardizedFileURL.absoluteString)
        return
      }
      downloadAsset(appContext: appContext, url: url, localUrl: localUrl, promise: promise)
    }
  }

  private func getMD5Hash(fromURL url: URL) -> String? {
    guard let urlData = url.absoluteString.data(using: .utf8) else {
      return nil
    }
    return getMD5Hash(fromData: urlData)
  }

  private func getMD5Hash(fromData data: Data?) -> String? {
    guard let data = data else {
      return nil
    }
    return Data(Insecure.MD5.hash(data: data)).map { String(format: "%02hhx", $0) }.joined()
  }

  func downloadAsset(appContext: AppContext, url: URL, localUrl: URL, promise: Promise) {
    guard let fileSystem = appContext.fileSystem else {
      promise.reject(UnableToSaveAssetToDirectoryException(url))
      return
    }
    if !fileSystem.ensureDirExists(withPath: localUrl.path) {
      promise.reject(UnableToSaveAssetToDirectoryException(localUrl))
      return
    }

    guard fileSystem.permissions(forURI: localUrl).contains(EXFileSystemPermissionFlags.write) else {
      promise.reject(UnableToSaveAssetToDirectoryException(localUrl))
      return
    }

    let downloadTask = URLSession.shared.downloadTask(with: url) { urlOrNil, _, _ in
      guard let fileURL = urlOrNil else {
        promise.reject(UnableToDownloadAssetException(url))
        return
      }
      do {
        // the file may already exist, so we need to remove it first
        try? FileManager.default.removeItem(at: localUrl)
        try FileManager.default.moveItem(at: fileURL, to: localUrl)
        promise.resolve(localUrl.standardizedFileURL.absoluteString)
      } catch {
        promise.reject(UnableToSaveAssetToDirectoryException(localUrl))
      }
    }
    downloadTask.resume()
  }
}
