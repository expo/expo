import SDWebImageWebPCoder
import Photos

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
