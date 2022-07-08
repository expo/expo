// Copyright 2021-present 650 Industries. All rights reserved.

import CoreGraphics
import Photos
import UIKit
import ExpoModulesCore

public class ImageManipulatorModule: Module {
  typealias LoadImageCallback = (Result<UIImage, Error>) -> Void
  typealias SaveImageResult = (url: URL, data: Data)

  public func definition() -> ModuleDefinition {
    Name("ExpoImageManipulator")

    AsyncFunction("manipulateAsync", manipulateImage)
      .runOnQueue(.main)
  }

  internal func manipulateImage(url: URL, actions: [ManipulateAction], options: ManipulateOptions, promise: Promise) {
    loadImage(atUrl: url) { result in
      switch result {
      case .failure(let error):
        return promise.reject(error)
      case .success(let image):
        do {
          let newImage = try manipulate(image: image, actions: actions)
          let saveResult = try self.saveImage(newImage, options: options)

          promise.resolve([
            "uri": saveResult.url.absoluteString,
            "width": newImage.cgImage?.width ?? 0,
            "height": newImage.cgImage?.height ?? 0,
            "base64": options.base64 ? saveResult.data.base64EncodedString() : nil
          ])
        } catch {
          promise.reject(error)
        }
      }
    }
  }

  /**
   Loads the image from given URL.
   */
  internal func loadImage(atUrl url: URL, callback: @escaping LoadImageCallback) {
    if url.scheme == "data" {
      guard let data = try? Data(contentsOf: url), let image = UIImage(data: data) else {
        return callback(.failure(CorruptedImageDataException()))
      }
      return callback(.success(image))
    }
    if url.scheme == "assets-library" {
      // TODO: ALAsset URLs are deprecated as of iOS 11, we should migrate to `ph://` soon.
      return loadImageFromPhotoLibrary(url: url, callback: callback)
    }

    guard let imageLoader = self.appContext?.imageLoader else {
      return callback(.failure(ImageLoaderNotFoundException()))
    }
    guard let fileSystem = self.appContext?.fileSystem else {
      return callback(.failure(FileSystemNotFoundException()))
    }
    guard fileSystem.permissions(forURI: url).contains(.read) else {
      return callback(.failure(FileSystemReadPermissionException(url.absoluteString)))
    }

    imageLoader.loadImage(for: url) { error, image in
      guard let image = image, error == nil else {
        return callback(.failure(ImageLoadingFailedException(error.debugDescription)))
      }
      callback(.success(image))
    }
  }

  /**
   Loads the image from user's photo library.
   */
  internal func loadImageFromPhotoLibrary(url: URL, callback: @escaping LoadImageCallback) {
    guard let asset = PHAsset.fetchAssets(withALAssetURLs: [url], options: nil).firstObject else {
      return callback(.failure(ImageNotFoundException()))
    }
    let size = CGSize(width: asset.pixelWidth, height: asset.pixelHeight)
    let options = PHImageRequestOptions()

    options.resizeMode = .exact
    options.isNetworkAccessAllowed = true
    options.isSynchronous = true
    options.deliveryMode = .highQualityFormat

    PHImageManager.default().requestImage(for: asset, targetSize: size, contentMode: .aspectFit, options: options) { image, _ in
      guard let image = image else {
        return callback(.failure(ImageNotFoundException()))
      }
      return callback(.success(image))
    }
  }

  /**
   Saves the image as a file.
   */
  internal func saveImage(_ image: UIImage, options: ManipulateOptions) throws -> SaveImageResult {
    guard let fileSystem = self.appContext?.fileSystem else {
      throw FileSystemNotFoundException()
    }
    let directory = URL(fileURLWithPath: fileSystem.cachesDirectory).appendingPathComponent("ImageManipulator")
    let filename = UUID().uuidString.appending(options.format.fileExtension)
    let fileUrl = directory.appendingPathComponent(filename)

    fileSystem.ensureDirExists(withPath: directory.path)

    guard let data = imageData(from: image, format: options.format, compression: options.compress) else {
      throw CorruptedImageDataException()
    }
    do {
      try data.write(to: fileUrl, options: .atomic)
    } catch let error {
      throw ImageWriteFailedException(error.localizedDescription)
    }
    return (url: fileUrl, data: data)
  }
}

/**
 Returns pixel data representation of the image.
 */
func imageData(from image: UIImage, format: ImageFormat, compression: Double) -> Data? {
  switch format {
  case .jpeg, .jpg:
    return image.jpegData(compressionQuality: compression)
  case .png:
    return image.pngData()
  }
}
