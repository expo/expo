// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore
import MobileCoreServices
import Photos
import PhotosUI

internal struct MediaHandler {
  internal weak var fileSystem: EXFileSystemInterface?
  internal let options: ImagePickerOptions

  internal func handleMedia(_ mediaInfo: MediaInfo) async throws -> AssetInfo {
    let mediaType: String? = mediaInfo[UIImagePickerController.InfoKey.mediaType] as? String

    switch mediaType {
    case UTType.image.identifier:
      return try await handleImage(mediaInfo: mediaInfo)
    case UTType.movie.identifier:
      return try await handleVideo(mediaInfo: mediaInfo)
    default:
      throw InvalidMediaTypeException(mediaType)
    }
  }

  internal func handleMultipleMedia(_ selection: [PHPickerResult]) async throws -> [AssetInfo] {
    return try await asyncMap(selection) { selectedItem in
      let itemProvider = selectedItem.itemProvider

      if itemProvider.canLoadObject(ofClass: PHLivePhoto.self) && options.mediaTypes.contains(.livePhotos) {
        return try await handleLivePhoto(from: selectedItem)
      }
      if itemProvider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
        return try await handleImage(from: selectedItem)
      }
      if itemProvider.hasItemConformingToTypeIdentifier(UTType.movie.identifier) {
        return try await handleVideo(from: selectedItem)
      }
      throw InvalidMediaTypeException(itemProvider.registeredTypeIdentifiers.first)
    }
  }

  // MARK: - Image

  private func handleImage(mediaInfo: MediaInfo) async throws -> AssetInfo {
    do {
      guard let image = ImageUtils.readImageFrom(mediaInfo: mediaInfo, shouldReadCroppedImage: options.allowsEditing) else {
        throw FailedToReadImageException()
      }

      let (imageData, fileExtension) = try ImageUtils.readDataAndFileExtension(
        image: image,
        mediaInfo: mediaInfo,
        options: options
      )

      let targetUrl = try generateUrl(withFileExtension: fileExtension)
      let mimeType = getMimeType(from: targetUrl.pathExtension)

      // no modification requested
      let imageModified = options.allowsEditing || options.quality < 1
      let fileWasCopied = !imageModified && ImageUtils.tryCopyingOriginalImageFrom(mediaInfo: mediaInfo, to: targetUrl)
      if !fileWasCopied {
        try ImageUtils.write(imageData: imageData, to: targetUrl)
      }

      // as calling this already requires media library permission, we can access it here
      // if user gave limited permissions, in the worst case this will be null
      let asset = mediaInfo[.phAsset] as? PHAsset
      var fileName = asset?.value(forKey: "filename") as? String
      // Extension will change to png when editing BMP files, reflect that change in fileName
      if let unwrappedName = fileName {
        fileName = replaceFileExtension(fileName: unwrappedName, targetExtension: fileExtension.lowercased())
      }
      let fileSize = getFileSize(from: targetUrl)

      let base64 = options.base64 ? try ImageUtils.readBase64From(imageData: imageData, orImageFileUrl: targetUrl, tryReadingFile: fileWasCopied) : nil

      let exif = options.exif ? await ImageUtils.readExifFrom(mediaInfo: mediaInfo) : nil

      return AssetInfo(
        assetId: asset?.localIdentifier,
        uri: targetUrl.absoluteString,
        width: image.size.width,
        height: image.size.height,
        fileName: fileName,
        fileSize: fileSize,
        mimeType: mimeType,
        base64: base64,
        exif: exif
      )
    } catch let exception as Exception {
      throw exception
    } catch {
      throw UnexpectedException(error)
    }
  }

  private func handleImage(from selectedImage: PHPickerResult) async throws -> AssetInfo {
    let itemProvider = selectedImage.itemProvider
    let rawData = try await itemProvider.loadImageDataRepresentation()

    guard let image = UIImage(data: rawData) else {
      throw Exception(name: "FailedCreatingUIImage", description: "")
    }

    let (imageData, fileExtension) = try ImageUtils.readDataAndFileExtension(
      image: image,
      rawData: rawData,
      itemProvider: itemProvider,
      options: options
    )

    let mimeType = getMimeType(from: String(fileExtension.dropFirst()))
    let targetUrl = try generateUrl(withFileExtension: fileExtension)
    try ImageUtils.write(imageData: imageData, to: targetUrl)
    let fileSize = getFileSize(from: targetUrl)
    let fileName = itemProvider.suggestedName.map { $0 + fileExtension }

    // We need to get EXIF from original image data, as it is being lost in UIImage
    let exif = options.exif ? ImageUtils.readExifFrom(data: rawData) : nil
    let base64 = options.base64 ? imageData?.base64EncodedString() : nil

    return AssetInfo(
      assetId: selectedImage.assetIdentifier,
      uri: targetUrl.absoluteString,
      width: image.size.width,
      height: image.size.height,
      fileName: fileName,
      fileSize: fileSize,
      mimeType: mimeType,
      base64: base64,
      exif: exif
    )
  }

  // Unlike the case of regular images, we have to operate on original data of the image in order to preserve the exif data,
  // otherwise it won't be possible to connect the image and video into a `PHLivePhoto` after reading it from the cache directory later.
  // As a result a live photo photo cannot be compressed or edited.
  private func handleLivePhoto(from selectedImage: PHPickerResult) async throws -> AssetInfo {
    let itemProvider = selectedImage.itemProvider
    let livePhotoObject = try await itemProvider.loadObject(ofClass: PHLivePhoto.self)
    guard let livePhoto = livePhotoObject as? PHLivePhoto else {
      throw FailedToPickLivePhotoException()
    }
    let assetResources = PHAssetResource.assetResources(for: livePhoto)
    guard
      let photoResource = assetResources.first(where: { $0.type == .photo }),
      let videoResource = assetResources.first(where: { $0.type == .pairedVideo })
    else {
      throw FailedToPickLivePhotoException()
    }

    let fileName = photoResource.originalFilename
    let pairedVideoFileName = videoResource.originalFilename
    let photoFileExtension = getFileExtension(from: fileName)
    let pairedVideoFileExtension = getFileExtension(from: pairedVideoFileName)
    let (photoUrl, pairedVideoUrl) = try generatePairedUrls(photoFileExtension: photoFileExtension, videoFileExtension: pairedVideoFileExtension)

    let imageData = try await PHAssetResourceManager.default().requestData(for: photoResource, options: nil)

    try await PHAssetResourceManager.default().writeData(for: photoResource, toFile: photoUrl, options: nil)
    try await PHAssetResourceManager.default().writeData(for: videoResource, toFile: pairedVideoUrl, options: nil)

    let fileSize = getFileSize(from: photoUrl)
    let mimeType = getMimeType(from: photoUrl.pathExtension)
    let base64 = options.base64 ? imageData.base64EncodedString() : nil
    let exif = options.exif ? ImageUtils.readExifFrom(data: imageData) : nil

    let pairedVideoAssetInfo = try getPairedAssetInfo(from: videoResource, fileUrl: pairedVideoUrl, assetId: selectedImage.assetIdentifier)

    return AssetInfo(
      assetId: selectedImage.assetIdentifier,
      type: "livePhoto",
      uri: photoUrl.absoluteString,
      width: livePhoto.size.width,
      height: livePhoto.size.height,
      fileName: fileName,
      fileSize: fileSize,
      mimeType: mimeType,
      base64: base64,
      exif: exif,
      pairedVideoAsset: pairedVideoAssetInfo
    )
  }

  private func getPairedAssetInfo(from videoResource: PHAssetResource, fileUrl: URL, assetId: String?) throws -> AssetInfo {
    let fileName = videoResource.originalFilename
    guard let dimensions = VideoUtils.readSizeFrom(url: fileUrl) else {
      throw FailedToReadVideoSizeException()
    }
    let duration = VideoUtils.readDurationFrom(url: fileUrl)
    let mimeType = getMimeType(from: fileUrl.pathExtension)
    let fileSize = getFileSize(from: fileUrl)

    return AssetInfo(
      assetId: assetId,
      type: "pairedVideo",
      uri: fileUrl.absoluteString,
      width: dimensions.width,
      height: dimensions.height,
      fileName: fileName,
      fileSize: fileSize,
      mimeType: mimeType,
      duration: duration
    )
  }

  private func getMimeType(from pathExtension: String) -> String? {
    return UTType(filenameExtension: pathExtension)?.preferredMIMEType
  }

  // MARK: - Video

  func handleVideo(mediaInfo: MediaInfo) async throws -> AssetInfo {
    guard let pickedVideoUrl = VideoUtils.readVideoUrlFrom(mediaInfo: mediaInfo) else {
      throw FailedToReadVideoException()
    }

    let targetUrl = try generateUrl(withFileExtension: ".mov")

    try VideoUtils.tryCopyingVideo(at: pickedVideoUrl, to: targetUrl)

    guard let dimensions = VideoUtils.readSizeFrom(url: targetUrl) else {
      throw FailedToReadVideoSizeException()
    }

    // If video was edited (the duration is affected) then read the duration from the original edited video.
    // Otherwise read the duration from the target video file.
    // TODO: (@bbarthec): inspect whether it makes sense to read duration from two different assets
    let videoUrlToReadDurationFrom = self.options.allowsEditing ? pickedVideoUrl : targetUrl
    let duration = VideoUtils.readDurationFrom(url: videoUrlToReadDurationFrom)

    let asset = mediaInfo[.phAsset] as? PHAsset
    let mimeType = getMimeType(from: targetUrl.pathExtension)
    let fileName = asset?.value(forKey: "filename") as? String
    let fileSize = getFileSize(from: targetUrl)

    return AssetInfo(
      assetId: asset?.localIdentifier,
      type: "video",
      uri: targetUrl.absoluteString,
      width: dimensions.width,
      height: dimensions.height,
      fileName: fileName,
      fileSize: fileSize,
      mimeType: mimeType,
      duration: duration
    )
  }

  private func handleVideo(from selectedVideo: PHPickerResult) async throws -> AssetInfo {
    let videoUrl = try await VideoUtils.loadVideoRepresentation(provider: selectedVideo.itemProvider) { tmpUrl in
      // We need to copy the result into a place that we control, because the picker
      // can remove the original file during conversion.
      return try generateUrl(withFileExtension: ".\(tmpUrl.pathExtension)")
    }

    // In case of passthrough, we want original file extension, mp4 otherwise
    // TODO: (barthap) Support other file extensions?
    let transcodeFileType = AVFileType.mp4
    let transcodeFileExtension = ".mp4"
    let mimeType = getMimeType(from: videoUrl.pathExtension)

    // Transcoding may need a separate url
    let transcodedUrl = try generateUrl(withFileExtension: transcodeFileExtension)

    let targetUrl = try await VideoUtils.transcodeVideoAsync(
      sourceAssetUrl: videoUrl,
      destinationUrl: transcodedUrl,
      outputFileType: transcodeFileType,
      exportPreset: options.videoExportPreset
    )
    let fileName = selectedVideo.itemProvider.suggestedName.map { $0 + transcodeFileExtension }

    return try buildVideoResult(for: targetUrl, withName: fileName, mimeType: mimeType, assetId: selectedVideo.assetIdentifier)
  }

  // MARK: - utils

  private func replaceFileExtension(fileName: String, targetExtension: String) -> String {
    if !fileName.lowercased().hasSuffix(targetExtension.lowercased()) {
      return deleteFileExtension(fileName: fileName) + targetExtension
    }
    return fileName
  }

  private func deleteFileExtension(fileName: String) -> String {
    var components = fileName.components(separatedBy: ".")
    guard components.count > 1 else {
      return fileName
    }
    components.removeLast()
    return components.joined(separator: ".")
  }

  private func generateUrl(withFileExtension: String) throws -> URL {
    guard let fileSystem = self.fileSystem else {
      throw FileSystemModuleNotFoundException()
    }
    let directory = fileSystem.cachesDirectory.appending(
      fileSystem.cachesDirectory.hasSuffix("/") ? "" : "/" + "ImagePicker"
    )
    let path = fileSystem.generatePath(inDirectory: directory, withExtension: withFileExtension)
    return URL(fileURLWithPath: path)
  }

  private func generatePairedUrls(photoFileExtension: String, videoFileExtension: String) throws -> (URL, URL) {
    let parsedVideoFileExtension = videoFileExtension.starts(with: ".") ? String(videoFileExtension.dropFirst()) : videoFileExtension
    let photoUrl = try generateUrl(withFileExtension: photoFileExtension)
    let baseUrl = photoUrl.deletingLastPathComponent()
    let filename = photoUrl.deletingPathExtension().lastPathComponent
    let videoUrl = baseUrl.appendingPathComponent(filename).appendingPathExtension(parsedVideoFileExtension)
    return (photoUrl, videoUrl)
  }

  private func buildVideoResult(for videoUrl: URL, withName fileName: String?, mimeType: String?, assetId: String?) throws -> AssetInfo {
    guard let size = VideoUtils.readSizeFrom(url: videoUrl) else {
      throw FailedToReadVideoSizeException()
    }
    let duration = VideoUtils.readDurationFrom(url: videoUrl)
    let fileSize = getFileSize(from: videoUrl)

    return AssetInfo(
      assetId: assetId,
      type: "video",
      uri: videoUrl.absoluteString,
      width: size.width,
      height: size.height,
      fileName: fileName,
      fileSize: fileSize,
      mimeType: mimeType,
      duration: duration
    )
  }

  private func getFileSize(from fileUrl: URL) -> Int? {
    do {
      let resources = try fileUrl.resourceValues(forKeys: [.fileSizeKey])
      return resources.fileSize
    } catch {
      log.error("Failed to get file size for \(fileUrl.absoluteString)")
      return nil
    }
  }

  private func getFileExtension(from fileName: String) -> String {
    return ".\(URL(fileURLWithPath: fileName).pathExtension)"
  }
}

fileprivate extension PHAssetResourceManager {
  func requestData(for assetResource: PHAssetResource, options: PHAssetResourceRequestOptions?) async throws -> Data {
    return try await withCheckedThrowingContinuation { continuation in
      var data = Data()
      let dataHandler = { (dataBatch: Data) in
        data.append(dataBatch)
      }
      let completionHandler = {(error: Error?) in
        if let error {
          continuation.resume(throwing: error)
          return
        }
        continuation.resume(returning: data)
      }

      self.requestData(for: assetResource, options: options, dataReceivedHandler: dataHandler, completionHandler: completionHandler)
    }
  }
}
