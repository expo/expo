import SDWebImageWebPCoder
import Photos
import ExpoModulesCore

internal typealias SaveImageResult = (url: URL, data: Data)

/**
 Loads the image from given URL.
 */
internal func loadImage(atUrl url: URL, appContext: AppContext) async throws -> UIImage {
  if url.scheme == "data" {
    guard let data = try? Data(contentsOf: url), let image = UIImage(data: data) else {
      throw CorruptedImageDataException()
    }
    return image
  }
  if url.scheme == "ph" || url.scheme == "assets-library" {
    return try await loadImageFromPhotoLibrary(url: url)
  }

  guard let imageLoader = appContext.imageLoader else {
    throw ImageLoaderNotFoundException()
  }
  guard FileSystemUtilities.permissions(appContext, for: url).contains(.read) else {
    throw FileSystemReadPermissionException(url.absoluteString)
  }

  do {
    if let result = try await imageLoader.loadImage(for: url) {
      return result
    }
  } catch {
    throw ImageLoadingFailedException((error as NSError).debugDescription)
  }
  // TODO: throw something better
  throw ImageLoadingFailedException("")
}

/**
 Loads the image from user's photo library.
 */
internal func loadImageFromPhotoLibrary(url: URL) async throws -> UIImage {
  guard let asset = retrieveAsset(from: url) else {
    throw ImageNotFoundException()
  }
  let size = CGSize(width: asset.pixelWidth, height: asset.pixelHeight)
  let options = PHImageRequestOptions()

  options.resizeMode = .exact
  options.isNetworkAccessAllowed = true
  options.isSynchronous = true
  options.deliveryMode = .highQualityFormat

  return try await withCheckedThrowingContinuation { continuation in
    PHImageManager.default().requestImage(for: asset, targetSize: size, contentMode: .aspectFit, options: options) { image, _ in
      if let image {
        continuation.resume(returning: image)
      } else {
        continuation.resume(throwing: ImageNotFoundException())
      }
    }
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
  case .webp:
    return SDImageWebPCoder.shared.encodedData(with: image, format: .webP, options: [.encodeCompressionQuality: compression])
  }
}

/**
 Checks if we are dealing with a ph asset URL and uses the correct method to fetch it.
 */
func retrieveAsset(from url: URL) -> PHAsset? {
  if url.scheme == "ph" {
    let identifier = String(url.absoluteString.dropFirst(5)) // removes ph://
    return PHAsset.fetchAssets(withLocalIdentifiers: [identifier], options: nil).firstObject
  }
  return PHAsset.fetchAssets(withALAssetURLs: [url], options: nil).firstObject
}

/**
 Helper function for drawing the image in graphics context.
 Throws appropriate exceptions when the context is missing or the image couldn't be rendered.
 */
internal func drawInNewContext(size: CGSize, drawing: (UIGraphicsImageRendererContext) -> Void) -> UIImage {
  let format = UIGraphicsImageRendererFormat()
  format.scale = 1

  let renderer = UIGraphicsImageRenderer(size: size, format: format)

  return renderer.image { context in
    drawing(context)
  }
}

/**
 Saves the image as a file.
 */
internal func saveImage(_ image: UIImage, options: ManipulateOptions, appContext: AppContext) throws -> SaveImageResult {
  guard let cachesDirectory = appContext.config.cacheDirectory else {
    throw FileSystemNotFoundException()
  }

  let directory = URL(fileURLWithPath: cachesDirectory.path).appendingPathComponent("ImageManipulator")
  let filename = UUID().uuidString.appending(options.format.fileExtension)
  let fileUrl = directory.appendingPathComponent(filename)

  FileSystemUtilities.ensureDirExists(at: directory)

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
