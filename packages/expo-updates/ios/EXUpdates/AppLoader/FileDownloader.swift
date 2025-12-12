//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable file_length
// swiftlint:disable force_cast
// swiftlint:disable function_parameter_count
// swiftlint:disable implicitly_unwrapped_optional
// swiftlint:disable identifier_name
// swiftlint:disable legacy_objc_type
// swiftlint:disable closure_body_length
// swiftlint:disable type_body_length
// swiftlint:disable force_unwrapping
// swiftlint:disable no_grouping_extension

import Foundation
import EASClient

public typealias SuccessBlock = (_ data: Data?, _ urlResponse: URLResponse) -> Void
public typealias ErrorBlock = (_ error: UpdatesError) -> Void
public typealias FileDownloadProgressBlock = (_ fractionCompleted: Double) -> Void
public typealias HashSuccessBlock = (_ data: Data, _ urlResponse: URLResponse, _ base64URLEncodedSHA256Hash: String) -> Void

internal typealias RemoteUpdateDownloadSuccessBlock = (_ updateResponse: UpdateResponse) -> Void
internal typealias RemoteUpdateDownloadErrorBlock = (_ error: UpdatesError) -> Void

private typealias ParseManifestSuccessBlock = (_ manifestUpdateResponsePart: ManifestUpdateResponsePart) -> Void
private typealias ParseManifestErrorBlock = (_ error: UpdatesError) -> Void
private typealias ParseDirectiveSuccessBlock = (_ directiveUpdateResponsePart: DirectiveUpdateResponsePart) -> Void
private typealias ParseDirectiveErrorBlock = (_ error: UpdatesError) -> Void

private extension String {
  func truncate(toMaxLength: Int) -> String {
    if toMaxLength <= 0 {
      return ""
    }

    if toMaxLength < self.count {
      let endIndex = self.index(self.startIndex, offsetBy: toMaxLength)
      return String(self[...endIndex])
    }

    return self
  }
}

private extension Dictionary where Iterator.Element == (key: String, value: Any) {
  func stringValueForCaseInsensitiveKey(_ searchKey: Key) -> String? {
    let valueRaw = self.first { (key: Key, _: Value) in
      return key.caseInsensitiveCompare(searchKey) == .orderedSame
    }?.value

    guard let valueRaw = valueRaw as? String else {
      return nil
    }
    return valueRaw
  }
}

/**
 * Utility class that holds all the logic for downloading data and files, such as update manifests
 * and assets, using NSURLSession.
 */
public final class FileDownloader {
  private static let DefaultTimeoutInterval: TimeInterval = 60
  private static let MultipartManifestPartName = "manifest"
  private static let MultipartDirectivePartName = "directive"
  private static let MultipartExtensionsPartName = "extensions"
  private static let MultipartCertificateChainPartName = "certificate_chain"
  private static let DiffIMValue = "bsdiff"
  private static let PatchTempSuffix = ".patch"
  private static let PatchedTempSuffix = ".patched"
  private static let ExpoCurrentUpdateIdHeader = "Expo-Current-Update-ID"
  private static let ExpoRequestedUpdateIdHeader = "Expo-Requested-Update-ID"
  private static let AIMHeader = "A-IM"
  private static let IMHeader = "im"
  private static let ExpoBaseUpdateIdResponseHeader = "expo-base-update-id"

  private static let ParameterParserSemicolonDelimiter = ";".utf16.first!

  // these can be made non-forced lets when NSObject protocol is removed
  private var session: URLSession!
  private var sessionConfiguration: URLSessionConfiguration!
  private var config: UpdatesConfig!
  private var logger: UpdatesLogger!
  private let updatesDirectory: URL
  private let database: UpdatesDatabase

  public convenience init(
    config: UpdatesConfig,
    logger: UpdatesLogger,
    updatesDirectory: URL,
    database: UpdatesDatabase
  ) {
    self.init(
      config: config,
      urlSessionConfiguration: URLSessionConfiguration.default,
      logger: logger,
      updatesDirectory: updatesDirectory,
      database: database
    )
  }

  required init(
    config: UpdatesConfig,
    urlSessionConfiguration: URLSessionConfiguration,
    logger: UpdatesLogger,
    updatesDirectory: URL,
    database: UpdatesDatabase
  ) {
    self.sessionConfiguration = urlSessionConfiguration
    self.config = config
    self.logger = logger
    self.updatesDirectory = updatesDirectory
    self.database = database
    self.session = URLSession(configuration: sessionConfiguration)
  }

  deinit {
    self.session.finishTasksAndInvalidate()
  }

  public static let assetFilesQueue: DispatchQueue = DispatchQueue(label: "expo.controller.AssetFilesQueue")

  public func downloadAsset(
    asset: UpdateAsset,
    fromURL url: URL,
    verifyingHash expectedBase64URLEncodedSHA256Hash: String?,
    toPath destinationPath: String,
    extraHeaders: [String: Any],
    allowPatch: Bool = true,
    launchedUpdate: Update? = nil,
    requestedUpdate: Update? = nil,
    skipPatchProcessing: Bool = false,
    progressBlock: FileDownloadProgressBlock? = nil,
    successBlock: @escaping HashSuccessBlock,
    errorBlock: @escaping ErrorBlock
  ) {
    let canAttemptPatch = allowPatch &&
      asset.isLaunchAsset &&
      launchedUpdate != nil &&
      requestedUpdate != nil &&
      launchedUpdate!.updateId != requestedUpdate!.updateId

    let headers = headersForPatch(extraHeaders, allowPatch: canAttemptPatch && !skipPatchProcessing)
    downloadData(
      fromURL: url,
      extraHeaders: headers,
      progressBlock: progressBlock
    ) { data, response in
      guard let data else {
        let error = UpdatesError.fileDownloaderAssetDownloadEmptyResponse(url: url)
        self.logger.error(cause: error, code: UpdatesErrorCode.assetsFailedToLoad)
        errorBlock(error)
        return
      }

      let httpResponse = response as? HTTPURLResponse
      let patchMetadata = httpResponse.flatMap { FileDownloader.parsePatchResponseMetadata(from: $0) }
      let isPatch = patchMetadata != nil

      if !skipPatchProcessing && isPatch && !canAttemptPatch {
        self.logger.warn(
          message: "Received patch when patch support disabled for asset \(asset.key ?? asset.filename)",
          code: UpdatesErrorCode.assetsFailedToLoad,
          updateId: requestedUpdate?.updateId.uuidString,
          assetId: asset.key ?? asset.filename
        )
        self.downloadAsset(
          asset: asset,
          fromURL: url,
          verifyingHash: expectedBase64URLEncodedSHA256Hash,
          toPath: destinationPath,
          extraHeaders: extraHeaders,
          allowPatch: false,
          launchedUpdate: launchedUpdate,
          requestedUpdate: requestedUpdate,
          skipPatchProcessing: true,
          progressBlock: progressBlock,
          successBlock: successBlock,
          errorBlock: errorBlock
        )
        return
      }

      if !skipPatchProcessing,
        canAttemptPatch,
        let response = httpResponse,
        let patchMetadata {
        guard let launchedUpdate else {
          self.logger.warn(
            message: "Missing launched update when attempting to apply diff for asset \(asset.key ?? asset.filename); retrying with full download",
            code: UpdatesErrorCode.assetsFailedToLoad,
            updateId: requestedUpdate?.updateId.uuidString,
            assetId: asset.key ?? asset.filename
          )
          self.downloadAsset(
            asset: asset,
            fromURL: url,
            verifyingHash: expectedBase64URLEncodedSHA256Hash,
            toPath: destinationPath,
            extraHeaders: extraHeaders,
            allowPatch: false,
            launchedUpdate: launchedUpdate,
            requestedUpdate: requestedUpdate,
            skipPatchProcessing: true,
            progressBlock: progressBlock,
            successBlock: successBlock,
            errorBlock: errorBlock
          )
          return
        }
        if !Self.validatePatchResponseMetadata(patchMetadata, launchedUpdate: launchedUpdate, requestedUpdate: requestedUpdate) {
          self.logger.warn(
            message: "Patch response missing required headers or had mismatched identifiers; retrying with full asset download",
            code: UpdatesErrorCode.assetsFailedToLoad,
            updateId: requestedUpdate?.updateId.uuidString,
            assetId: asset.key ?? asset.filename
          )
          self.downloadAsset(
            asset: asset,
            fromURL: url,
            verifyingHash: expectedBase64URLEncodedSHA256Hash,
            toPath: destinationPath,
            extraHeaders: extraHeaders,
            allowPatch: false,
            launchedUpdate: launchedUpdate,
            requestedUpdate: requestedUpdate,
            skipPatchProcessing: true,
            progressBlock: progressBlock,
            successBlock: successBlock,
            errorBlock: errorBlock
          )
          return
        }
        do {
          let (patchedData, hashBase64String) = try self.applyHermesDiff(
            asset: asset,
            diffData: data,
            destinationPath: destinationPath,
            launchedUpdate: launchedUpdate,
            requestedUpdate: requestedUpdate,
            expectedBase64URLEncodedSHA256Hash: expectedBase64URLEncodedSHA256Hash
          )
          successBlock(patchedData, response, hashBase64String)
          return
        } catch {
          let updatesError = UpdatesError.fileDownloaderUnknownError(cause: error)
          self.logger.error(
            cause: updatesError,
            code: UpdatesErrorCode.assetsFailedToLoad,
            updateId: requestedUpdate?.updateId.uuidString,
            assetId: asset.key ?? asset.filename
          )
          self.downloadAsset(
            asset: asset,
            fromURL: url,
            verifyingHash: expectedBase64URLEncodedSHA256Hash,
            toPath: destinationPath,
            extraHeaders: extraHeaders,
            allowPatch: false,
            launchedUpdate: launchedUpdate,
            requestedUpdate: requestedUpdate,
            progressBlock: progressBlock,
            successBlock: successBlock,
            errorBlock: errorBlock
          )
          return
        }
      }

      let hashBase64String = UpdatesUtils.base64UrlEncodedSHA256WithData(data)
      if let expectedBase64URLEncodedSHA256Hash,
        expectedBase64URLEncodedSHA256Hash != hashBase64String {
        let error = UpdatesError.fileDownloaderAssetMismatchedHash(
          url: url,
          expectedBase64URLEncodedSHA256Hash: expectedBase64URLEncodedSHA256Hash,
          actualBase64URLEncodedSHA256Hash: hashBase64String
        )
        self.logger.error(cause: error, code: UpdatesErrorCode.assetsFailedToLoad)
        errorBlock(error)
        return
      }

      do {
        try data.write(to: URL(fileURLWithPath: destinationPath), options: .atomic)
        successBlock(data, response, hashBase64String)
        return
      } catch {
        let cause = UpdatesError.fileDownloaderAssetFileWriteFailed(cause: error, destinationPath: destinationPath)
        self.logger.error(cause: cause, code: UpdatesErrorCode.assetsFailedToLoad)
        errorBlock(cause)
        return
      }
    } errorBlock: { error in
      self.logger.error(cause: error, code: UpdatesErrorCode.assetsFailedToLoad)
      errorBlock(error)
    }
  }

  func downloadData(
    fromURL url: URL,
    extraHeaders: [String: Any],
    progressBlock: FileDownloadProgressBlock?,
    successBlock: @escaping SuccessBlock,
    errorBlock: @escaping ErrorBlock
  ) {
    let request = createGenericRequest(withURL: url, extraHeaders: extraHeaders)
    downloadData(withRequest: request, progressBlock: progressBlock, successBlock: successBlock, errorBlock: errorBlock)
  }

  func downloadRemoteUpdate(
    fromURL url: URL,
    withDatabase database: UpdatesDatabase,
    extraHeaders: [String: Any]?,
    successBlock: @escaping RemoteUpdateDownloadSuccessBlock,
    errorBlock: @escaping RemoteUpdateDownloadErrorBlock
  ) {
    let request = createManifestRequest(withURL: url, extraHeaders: extraHeaders)
    downloadData(
      withRequest: request,
      progressBlock: nil
    ) { data, response in
      guard let response = response as? HTTPURLResponse else {
        let error = UpdatesError.fileDownloaderResponseNotHTTPURLResponse
        self.logger.error(cause: error, code: UpdatesErrorCode.unknown)
        errorBlock(error)
        return
      }
      self.parseManifestResponse(response, withData: data, database: database, successBlock: successBlock, errorBlock: errorBlock)
    } errorBlock: { error in
      errorBlock(error)
    }
  }

  /**
   * Get extra (stateful) headers to pass into `downloadManifestFromURL:`
   * Must be called on the database queue
   */
  static func extraHeadersForRemoteUpdateRequest(
    withDatabase database: UpdatesDatabase,
    config: UpdatesConfig,
    logger: UpdatesLogger,
    launchedUpdate: Update?,
    embeddedUpdate: Update?
  ) -> [String: Any] {
    let scopeKey = config.scopeKey

    var extraHeaders: [String: Any] = [:]
    do {
      extraHeaders = try database.serverDefinedHeaders(withScopeKey: scopeKey) ?? [:]
    } catch {
      logger.error(cause: UpdatesError.fileDownloaderServerDefinedHeaderFailure(cause: error))
    }

    do {
      if let extraClientParams = try database.extraParams(withScopeKey: scopeKey) {
        let structuredHeaderDictionary = try StringDictionary(value: extraClientParams.mapValues({ value in
          try StringItem(value: value)
        }))
        extraHeaders["Expo-Extra-Params"] = structuredHeaderDictionary.serialize()
      }
    } catch {
      logger.error(cause: UpdatesError.fileDownloaderExtraParamFailure(cause: error))
    }

    if let launchedUpdate {
      extraHeaders["Expo-Current-Update-ID"] = launchedUpdate.updateId.uuidString.lowercased()
    }

    if let embeddedUpdate = embeddedUpdate {
      extraHeaders["Expo-Embedded-Update-ID"] = embeddedUpdate.updateId.uuidString.lowercased()
    }

    do {
      let failedUpdateIDs = try database.recentUpdateIdsWithFailedLaunch()
      if !failedUpdateIDs.isEmpty {
        let structuredHeaderList = try StringList(value: failedUpdateIDs.map({ item in
          try StringItem(value: item.uuidString.lowercased())
        }))
        extraHeaders["Expo-Recent-Failed-Update-IDs"] = structuredHeaderList.serialize()
      }
    } catch {
      logger.error(cause: UpdatesError.fileDownloaderExtraParamFailure(cause: error))
    }

    return extraHeaders
  }

   /**
   * Get extra headers to pass into `downloadAsset:`
   */
  static func extraHeadersForRemoteAssetRequest(
    launchedUpdate: Update?,
    embeddedUpdate: Update?,
    requestedUpdate: Update?
  ) -> [String: Any] {
    var extraHeaders: [String: Any] = [:]
    if let launchedUpdate {
      extraHeaders["Expo-Current-Update-ID"] = launchedUpdate.updateId.uuidString.lowercased()
    }

    if let embeddedUpdate {
      extraHeaders["Expo-Embedded-Update-ID"] = embeddedUpdate.updateId.uuidString.lowercased()
    }

    if let requestedUpdate {
      extraHeaders["Expo-Requested-Update-ID"] = requestedUpdate.updateId.uuidString.lowercased()
    }

    return extraHeaders
  }

  private static func setHTTPHeaderFields(_ headers: [String: Any?]?, onRequest request: inout URLRequest) {
    guard let headers = headers else {
      return
    }

    for (key, value) in headers {
      switch value {
      case let value as String:
        request.setValue(value, forHTTPHeaderField: key)
      case let value as Bool:
        request.setValue(value ? "true" : "false", forHTTPHeaderField: key)
      case let value as NSNumber:
        request.setValue(value.stringValue, forHTTPHeaderField: key)
      case is NSNull:
        // can probably remove this case after everything is swift
        request.setValue("null", forHTTPHeaderField: key)
      case nil:
        request.setValue("null", forHTTPHeaderField: key)
      default:
        request.setValue((value as! NSObject).description, forHTTPHeaderField: key)
      }
    }
  }

  private func setHTTPHeaderFields(request: inout URLRequest, extraHeaders: [String: Any?]) {
    FileDownloader.setHTTPHeaderFields(extraHeaders, onRequest: &request)
    request.setValue("ios", forHTTPHeaderField: "Expo-Platform")
    request.setValue("1", forHTTPHeaderField: "Expo-Protocol-Version")
    request.setValue("1", forHTTPHeaderField: "Expo-API-Version")
    request.setValue("BARE", forHTTPHeaderField: "Expo-Updates-Environment")
    request.setValue(EASClientID.uuid().uuidString, forHTTPHeaderField: "EAS-Client-ID")

    for (key, value) in config.requestHeaders {
      request.setValue(value, forHTTPHeaderField: key)
    }
  }

  private func setManifestHTTPHeaderFields(request: inout URLRequest, extraHeaders: [String: Any?]?) {
    // apply extra headers before anything else, so they don't override preset headers
    FileDownloader.setHTTPHeaderFields(extraHeaders, onRequest: &request)

    request.setValue("multipart/mixed,application/expo+json,application/json", forHTTPHeaderField: "Accept")
    request.setValue("ios", forHTTPHeaderField: "Expo-Platform")
    request.setValue("1", forHTTPHeaderField: "Expo-Protocol-Version")
    request.setValue("1", forHTTPHeaderField: "Expo-API-Version")
    request.setValue("BARE", forHTTPHeaderField: "Expo-Updates-Environment")
    request.setValue(EASClientID.uuid().uuidString, forHTTPHeaderField: "EAS-Client-ID")
    request.setValue("true", forHTTPHeaderField: "Expo-JSON-Error")
    request.setValue(config.runtimeVersion, forHTTPHeaderField: "Expo-Runtime-Version")

    if let previousFatalError = ErrorRecovery.consumeErrorLog(logger: logger) {
      // some servers can have max length restrictions for headers,
      // so we restrict the length of the string to 1024 characters --
      // this should satisfy the requirements of most servers
      request.setValue(previousFatalError.truncate(toMaxLength: 1024), forHTTPHeaderField: "Expo-Fatal-Error")
    }

    for (key, value) in config.requestHeaders {
      request.setValue(value, forHTTPHeaderField: key)
    }

    if let codeSigningConfiguration = config.codeSigningConfiguration {
      request.setValue(codeSigningConfiguration.createAcceptSignatureHeader(), forHTTPHeaderField: "expo-expect-signature")
    }
  }

  func createManifestRequest(withURL url: URL, extraHeaders: [String: Any?]?) -> URLRequest {
    var request = URLRequest(
      url: url,
      cachePolicy: self.sessionConfiguration.requestCachePolicy,
      timeoutInterval: FileDownloader.DefaultTimeoutInterval
    )
    setManifestHTTPHeaderFields(request: &request, extraHeaders: extraHeaders)
    return request
  }

  struct PatchResponseMetadata {
    let hasIMBsdiff: Bool
    let statusCode: Int
    let expoBaseUpdateId: String?
  }

  private static func parsePatchResponseMetadata(from response: HTTPURLResponse) -> PatchResponseMetadata? {
    let imHeaderRaw = response.value(forHTTPHeaderField: FileDownloader.IMHeader)
    let hasIMBsdiff = imHeaderRaw?
      .split(separator: ",")
      .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
      .contains { $0.caseInsensitiveCompare(FileDownloader.DiffIMValue) == .orderedSame } ?? false
    let statusCode = response.statusCode

    if !hasIMBsdiff && statusCode != 226 {
      return nil
    }

    return PatchResponseMetadata(
      hasIMBsdiff: hasIMBsdiff,
      statusCode: statusCode,
      expoBaseUpdateId: response.value(forHTTPHeaderField: FileDownloader.ExpoBaseUpdateIdResponseHeader)
    )
  }

  static func validatePatchResponseMetadata(
    _ metadata: PatchResponseMetadata,
    launchedUpdate: Update?,
    requestedUpdate _: Update?
  ) -> Bool {
    let expectedBase = launchedUpdate?.updateId.uuidString.lowercased()
    let expoBaseUpdateId = metadata.expoBaseUpdateId?.lowercased()

    if !metadata.hasIMBsdiff && metadata.statusCode != 226 {
      return false
    }

    guard let actualBase = expoBaseUpdateId else {
      return false
    }

    if let expectedBase, actualBase != expectedBase {
      return false
    }

    return true
  }

  private func headersForPatch(_ headers: [String: Any], allowPatch: Bool) -> [String: Any] {
    var newHeaders = headers
    newHeaders["Accept"] = "*/*"

    if allowPatch {
      newHeaders[FileDownloader.AIMHeader] = FileDownloader.DiffIMValue
    } else {
      newHeaders.removeValue(forKey: FileDownloader.AIMHeader)
    }
    return newHeaders
  }

  internal func applyHermesDiff(
    asset: UpdateAsset,
    diffData: Data,
    destinationPath: String,
    launchedUpdate: Update,
    requestedUpdate: Update?,
    expectedBase64URLEncodedSHA256Hash: String?
  ) throws -> (Data, String) {
    guard asset.isLaunchAsset else {
      throw DiffError.assetNotLaunch
    }

    let baseAsset = try resolveLaunchAsset(launchedUpdate: launchedUpdate)
    let baseFileUrl = try loadAndVerifyAsset(baseAsset)
    let requestedUpdateId = requestedUpdate?.updateId.uuidString

    return try createPatchedAsset(
      asset: asset,
      baseFileURL: baseFileUrl,
      diffData: diffData,
      destinationPath: destinationPath,
      expectedBase64URLEncodedSHA256Hash: expectedBase64URLEncodedSHA256Hash,
      requestedUpdateId: requestedUpdateId
    )
  }

  private func resolveLaunchAsset(launchedUpdate: Update) throws -> UpdateAsset {
    let currentUpdateId = launchedUpdate.updateId
    var launchAsset: UpdateAsset?
    var lookupError: Error?
    database.databaseQueue.sync {
      do {
        let assets = try database.assets(withUpdateId: currentUpdateId)
        launchAsset = assets.first(where: { $0.isLaunchAsset })
      } catch {
        lookupError = error
      }
    }

    if let lookupError {
      throw lookupError
    }

    guard let baseAsset = launchAsset else {
      throw DiffError.launchAssetNotFound
    }

    return baseAsset
  }

  private func loadAndVerifyAsset(_ baseAsset: UpdateAsset) throws -> URL {
    let baseFileUrl = updatesDirectory.appendingPathComponent(baseAsset.filename)
    guard FileManager.default.fileExists(atPath: baseFileUrl.path) else {
      throw DiffError.baseAssetMissing(path: baseFileUrl.path)
    }

    let baseData: Data
    do {
      baseData = try Data(contentsOf: baseFileUrl)
    } catch {
      throw DiffError.failedToReadBaseAsset(cause: error)
    }

    let actualBaseHash = UpdatesUtils.base64UrlEncodedSHA256WithData(baseData)
    if let expectedBaseHash = baseAsset.expectedHash,
      expectedBaseHash != actualBaseHash {
      throw DiffError.baseHashMismatch(expected: expectedBaseHash, actual: actualBaseHash)
    }

    if baseAsset.expectedHash == nil,
      let storedContentHash = baseAsset.contentHash,
      !storedContentHash.isEmpty {
      let actualBaseHexHash = UpdatesUtils.hexEncodedSHA256WithData(baseData)
      if storedContentHash != actualBaseHexHash {
        throw DiffError.baseHexHashMismatch(expected: storedContentHash, actual: actualBaseHexHash)
      }
    }

    return baseFileUrl
  }

  internal func createPatchedAsset(
    asset: UpdateAsset,
    baseFileURL: URL,
    diffData: Data,
    destinationPath: String,
    expectedBase64URLEncodedSHA256Hash: String?,
    requestedUpdateId: String?
  ) throws -> (Data, String) {
    let patchUrl = URL(fileURLWithPath: destinationPath + FileDownloader.PatchTempSuffix)
    let patchedTempUrl = URL(fileURLWithPath: destinationPath + FileDownloader.PatchedTempSuffix)

    do {
      try diffData.write(to: patchUrl, options: .atomic)
    } catch {
      throw DiffError.failedToWritePatch(cause: error, path: patchUrl.path)
    }

    defer {
      try? FileManager.default.removeItem(at: patchUrl)
      try? FileManager.default.removeItem(at: patchedTempUrl)
    }

    do {
      try BSPatch.applyPatch(
        oldPath: baseFileURL.path,
        newPath: patchedTempUrl.path,
        patchPath: patchUrl.path
      )
    } catch {
      throw DiffError.patchFailed(cause: error)
    }

    let patchedData: Data
    do {
      patchedData = try Data(contentsOf: patchedTempUrl)
    } catch {
      throw DiffError.failedToReadPatchedAsset(cause: error)
    }

    let patchedHashBase64 = UpdatesUtils.base64UrlEncodedSHA256WithData(patchedData)

    if let expectedBase64URLEncodedSHA256Hash,
      expectedBase64URLEncodedSHA256Hash != patchedHashBase64 {
      throw DiffError.patchedHashMismatch(expected: expectedBase64URLEncodedSHA256Hash, actual: patchedHashBase64)
    }

    do {
      try patchedData.write(to: URL(fileURLWithPath: destinationPath), options: .atomic)
    } catch {
      throw DiffError.failedToWritePatchedAsset(cause: error, path: destinationPath)
    }

    logger.info(
      message: "Applied diff for asset \(asset.key ?? asset.filename)",
      code: UpdatesErrorCode.none,
      updateId: requestedUpdateId,
      assetId: asset.key ?? asset.filename
    )

    return (patchedData, patchedHashBase64)
  }

  func createGenericRequest(withURL url: URL, extraHeaders: [String: Any?]) -> URLRequest {
    var request = URLRequest(
      url: url,
      cachePolicy: self.sessionConfiguration.requestCachePolicy,
      timeoutInterval: FileDownloader.DefaultTimeoutInterval
    )
    setHTTPHeaderFields(request: &request, extraHeaders: extraHeaders)
    return request
  }

  // MARK: - manifest parsing

  func parseManifestResponse(
    _ httpResponse: HTTPURLResponse,
    withData data: Data?,
    database: UpdatesDatabase,
    successBlock: @escaping RemoteUpdateDownloadSuccessBlock,
    errorBlock: @escaping RemoteUpdateDownloadErrorBlock
  ) {
    let responseHeaderData = ResponseHeaderData(
      protocolVersionRaw: httpResponse.value(forHTTPHeaderField: "expo-protocol-version"),
      serverDefinedHeadersRaw: httpResponse.value(forHTTPHeaderField: "expo-server-defined-headers"),
      manifestFiltersRaw: httpResponse.value(forHTTPHeaderField: "expo-manifest-filters")
    )

    if httpResponse.statusCode == 204 || data == nil {
      if let protocolVersion = responseHeaderData.protocolVersion,
        protocolVersion > 0 {
        successBlock(UpdateResponse(
          responseHeaderData: responseHeaderData,
          manifestUpdateResponsePart: nil,
          directiveUpdateResponsePart: nil
        ))
        return
      }
    }

    guard let data = data else {
      let cause = UpdatesError.fileDownloaderRemoteUpdateMissingBody
      logger.error(cause: cause, code: UpdatesErrorCode.unknown)
      errorBlock(cause)
      return
    }

    let contentType = httpResponse.value(forHTTPHeaderField: "content-type") ?? ""

    if contentType.lowercased().hasPrefix("multipart/") {
      guard let scalar = UnicodeScalar(FileDownloader.ParameterParserSemicolonDelimiter) else {
        return
      }
      let contentTypeParameters = UpdatesParameterParser().parseParameterString(contentType, withDelimiter: Character(scalar))
      guard
        let boundaryParameterValue: String = contentTypeParameters.optionalValue(forKey: "boundary") else {
        let cause = UpdatesError.fileDownloaderMissingMultipartBoundary
        logger.error(cause: cause, code: UpdatesErrorCode.unknown)
        errorBlock(cause)
        return
      }

      parseMultipartManifestResponse(
        httpResponse,
        withData: data,
        database: database,
        boundary: boundaryParameterValue,
        successBlock: successBlock,
        errorBlock: errorBlock
      )
      return
    }

    let manifestResponseInfo = ResponsePartInfo(
      responseHeaderData: responseHeaderData,
      responsePartHeaderData: ResponsePartHeaderData(signature: httpResponse.value(forHTTPHeaderField: "expo-signature")),
      body: data
    )

    parseManifestResponsePartInfo(
      manifestResponseInfo,
      extensions: [:],
      certificateChainFromManifestResponse: nil,
      database: database
    ) { manifestUpdateResponsePart in
      successBlock(UpdateResponse(
        responseHeaderData: responseHeaderData,
        manifestUpdateResponsePart: manifestUpdateResponsePart,
        directiveUpdateResponsePart: nil
      ))
    } errorBlock: { error in
      errorBlock(error)
    }
  }

  private func parseMultipartManifestResponse(
    _ httpResponse: HTTPURLResponse,
    withData data: Data,
    database: UpdatesDatabase,
    boundary: String,
    successBlock: @escaping RemoteUpdateDownloadSuccessBlock,
    errorBlock: @escaping RemoteUpdateDownloadErrorBlock
  ) {
    let reader = UpdatesMultipartStreamReader(inputStream: InputStream(data: data), boundary: boundary)

    var manifestPartHeadersAndData: ([String: Any], Data)?
    var extensionsData: Data?
    var certificateChainStringData: Data?
    var directivePartHeadersAndData: ([String: Any], Data)?

    let completed = data.isEmpty || reader.readAllParts { headers, content, _ in
      guard let headers else {
        return
      }
      if let contentDisposition = headers.stringValueForCaseInsensitiveKey("content-disposition") {
        guard let scalar = UnicodeScalar(FileDownloader.ParameterParserSemicolonDelimiter) else {
          return
        }
        let contentDispositionParameters = UpdatesParameterParser().parseParameterString(contentDisposition, withDelimiter: Character(scalar))
        if
          let contentDispositionNameFieldValue: String = contentDispositionParameters.optionalValue(forKey: "name") {
          switch contentDispositionNameFieldValue {
          case FileDownloader.MultipartManifestPartName:
            if let content {
              manifestPartHeadersAndData = (headers, content)
            }
          case FileDownloader.MultipartDirectivePartName:
            if let content {
              directivePartHeadersAndData = (headers, content)
            }
          case FileDownloader.MultipartExtensionsPartName:
            extensionsData = content
          case FileDownloader.MultipartCertificateChainPartName:
            certificateChainStringData = content
          default:
            break
          }
        }
      }
    }

    if !completed {
      let cause = UpdatesError.fileDownloaderErrorReadingMultipartResponse
      logger.error(cause: cause, code: .unknown)
      errorBlock(cause)
      return
    }

    var extensions: [String: Any] = [:]
    if let extensionsData = extensionsData {
      let parsedExtensions: Any
      do {
        parsedExtensions = try JSONSerialization.jsonObject(with: extensionsData)
      } catch {
        errorBlock(UpdatesError.fileDownloaderUnknownError(cause: error))
        return
      }

      guard let parsedExtensions = parsedExtensions as? [String: Any] else {
        let cause = UpdatesError.fileDownloaderMultipartExtensionsPartParseFailed
        logger.error(cause: cause, code: .unknown)
        errorBlock(cause)
        return
      }

      extensions = parsedExtensions
    }

    if config.enableExpoUpdatesProtocolV0CompatibilityMode && manifestPartHeadersAndData == nil {
      let cause = UpdatesError.fileDownloaderMultipartMissingManifestVersion0
      logger.error(cause: cause, code: .unknown)
      errorBlock(cause)
      return
    }

    let certificateChain = certificateChainStringData.let { it -> String? in
      String(data: it, encoding: .utf8)
    }

    let responseHeaderData = ResponseHeaderData(
      protocolVersionRaw: httpResponse.value(forHTTPHeaderField: "expo-protocol-version"),
      serverDefinedHeadersRaw: httpResponse.value(forHTTPHeaderField: "expo-server-defined-headers"),
      manifestFiltersRaw: httpResponse.value(forHTTPHeaderField: "expo-manifest-filters")
    )

    let manifestResponseInfo = manifestPartHeadersAndData.let { it in
      ResponsePartInfo(
        responseHeaderData: responseHeaderData,
        responsePartHeaderData: ResponsePartHeaderData(signature: it.0.optionalValue(forKey: "expo-signature")),
        body: it.1
      )
    }

    // in v0 compatibility mode ignore directives
    let directiveResponseInfo = config.enableExpoUpdatesProtocolV0CompatibilityMode ?
    nil :
    directivePartHeadersAndData.let { it in
      ResponsePartInfo(
        responseHeaderData: responseHeaderData,
        responsePartHeaderData: ResponsePartHeaderData(signature: it.0.optionalValue(forKey: "expo-signature")),
        body: it.1
      )
    }

    var parseManifestResponse: ManifestUpdateResponsePart?
    var parseDirectiveResponse: DirectiveUpdateResponsePart?
    var didError = false

    let maybeFinish = {
      if !didError {
        let isManifestDone = manifestResponseInfo == nil || parseManifestResponse != nil
        let isDirectiveDone = directiveResponseInfo == nil || parseDirectiveResponse != nil

        if isManifestDone && isDirectiveDone {
          successBlock(UpdateResponse(
            responseHeaderData: responseHeaderData,
            manifestUpdateResponsePart: parseManifestResponse,
            directiveUpdateResponsePart: parseDirectiveResponse
          ))
        }
      }
    }

    if let directiveResponseInfo = directiveResponseInfo {
      parseDirectiveResponsePartInfo(
        directiveResponseInfo,
        certificateChainFromManifestResponse: certificateChain
      ) { directiveUpdateResponsePart in
        parseDirectiveResponse = directiveUpdateResponsePart
        maybeFinish()
      } errorBlock: { error in
        if !didError {
          didError = true
          errorBlock(error)
        }
      }
    }

    if let manifestResponseInfo = manifestResponseInfo {
      parseManifestResponsePartInfo(
        manifestResponseInfo,
        extensions: extensions,
        certificateChainFromManifestResponse: certificateChain,
        database: database
      ) { manifestUpdateResponsePart in
        parseManifestResponse = manifestUpdateResponsePart
        maybeFinish()
      } errorBlock: { error in
        if !didError {
          didError = true
          errorBlock(error)
        }
      }
    }

    // if both parts are empty, we still want to finish
    if manifestResponseInfo == nil && directiveResponseInfo == nil {
      maybeFinish()
    }
  }

  private func parseDirectiveResponsePartInfo(
    _ responsePartInfo: ResponsePartInfo,
    certificateChainFromManifestResponse: String?,
    successBlock: @escaping ParseDirectiveSuccessBlock,
    errorBlock: @escaping ParseDirectiveErrorBlock
  ) {
    // check code signing if code signing is configured
    // 1. verify the code signing signature (throw if invalid)
    // 2. then, if the code signing certificate is only valid for a particular project, verify that the manifest
    //    has the correct info for code signing. If the code signing certificate doesn't specify a particular
    //    project, it is assumed to be valid for all projects
    // 3. consider the directive valid if both of these pass
    if let codeSigningConfiguration = config.codeSigningConfiguration {
      let signatureValidationResult: SignatureValidationResult
      do {
        signatureValidationResult = try codeSigningConfiguration.validateSignature(
          logger: logger,
          signature: responsePartInfo.responsePartHeaderData.signature,
          signedData: responsePartInfo.body,
          manifestResponseCertificateChain: certificateChainFromManifestResponse
        )
      } catch {
        let cause: UpdatesError
        if let codeSigningError = error as? CodeSigningError {
          cause = UpdatesError.fileDownloaderCodeSigningError(cause: codeSigningError)
        } else {
          cause = UpdatesError.fileDownloaderCodeSigningUnknownError(cause: error)
        }
        self.logger.error(cause: cause, code: .unknown)
        errorBlock(cause)
        return
      }

      if signatureValidationResult.validationResult == .invalid {
        let cause = UpdatesError.fileDownloaderCodeSigningIncorrectSignature
        self.logger.error(cause: cause, code: .unknown)
        errorBlock(cause)
        return
      }

      if signatureValidationResult.validationResult != .skipped {
        if let expoProjectInformation = signatureValidationResult.expoProjectInformation {
          let directive: UpdateDirective
          do {
            directive = try UpdateDirective.fromJSONData(responsePartInfo.body)
          } catch {
            let cause = UpdatesError.fileDownloaderDirectiveParseFailed(cause: error)
            self.logger.error(cause: cause, code: .unknown)
            errorBlock(cause)
            return
          }

          if expoProjectInformation.projectId != directive.signingInfo?.easProjectId ||
            expoProjectInformation.scopeKey != directive.signingInfo?.scopeKey {
            let cause = UpdatesError.fileDownloaderCodeSigningCertificateScopeKeyOrProjectIdMismatch
            self.logger.error(cause: cause, code: .unknown)
            errorBlock(cause)
            return
          }
        }
        logger.info(message: "Update directive code signature verified successfully")
      }
    }

    let directive: UpdateDirective
    do {
      directive = try UpdateDirective.fromJSONData(responsePartInfo.body)
    } catch {
      let cause = UpdatesError.fileDownloaderDirectiveParseFailed(cause: error)
      self.logger.error(cause: cause, code: .unknown)
      errorBlock(cause)
      return
    }

    successBlock(DirectiveUpdateResponsePart(updateDirective: directive))
  }

  private func parseManifestResponsePartInfo(
    _ responsePartInfo: ResponsePartInfo,
    extensions: [String: Any],
    certificateChainFromManifestResponse: String?,
    database: UpdatesDatabase,
    successBlock: @escaping ParseManifestSuccessBlock,
    errorBlock: @escaping ParseManifestErrorBlock
  ) {
    var manifest: [String: Any]?
    do {
      manifest = try JSONSerialization.jsonObject(with: responsePartInfo.body) as? [String: Any]
    } catch {
      let cause = UpdatesError.fileDownloaderManifestParseFailed(cause: error)
      logger.error(cause: cause, code: .unknown)
      errorBlock(cause)
      return
    }

    guard let manifest = manifest else {
      let cause = UpdatesError.fileDownloaderManifestParseFailed(cause: nil)
      logger.error(cause: cause, code: .unknown)
      errorBlock(cause)
      return
    }

    createUpdate(
      manifest: manifest,
      responsePartInfo: responsePartInfo,
      extensions: extensions,
      certificateChainFromManifestResponse: certificateChainFromManifestResponse,
      database: database,
      successBlock: successBlock,
      errorBlock: errorBlock
    )
  }

  private func createUpdate(
    manifest: [String: Any],
    responsePartInfo: ResponsePartInfo,
    extensions: [String: Any],
    certificateChainFromManifestResponse: String?,
    database: UpdatesDatabase,
    successBlock: ParseManifestSuccessBlock,
    errorBlock: ParseManifestErrorBlock
  ) {
    var mutableManifest = manifest

    // Set the isVerified field in the manifest itself so that it is stored in the database.
    // Note that this is not considered for code signature verification.
    // currently this is only used by Expo Go, but moving it out of the library would require
    // also storing the signature so database-loaded-update validity could be derived at load
    // time.
    mutableManifest["isVerified"] = false

    // check code signing if code signing is configured
    // 1. verify the code signing signature (throw if invalid)
    // 2. then, if the code signing certificate is only valid for a particular project, verify that the manifest
    //    has the correct info for code signing. If the code signing certificate doesn't specify a particular
    //    project, it is assumed to be valid for all projects
    // 3. mark the manifest as verified if both of these pass
    if let codeSigningConfiguration = config.codeSigningConfiguration {
      let signatureValidationResult: SignatureValidationResult
      do {
        signatureValidationResult = try codeSigningConfiguration.validateSignature(
          logger: logger,
          signature: responsePartInfo.responsePartHeaderData.signature,
          signedData: responsePartInfo.body,
          manifestResponseCertificateChain: certificateChainFromManifestResponse
        )
      } catch {
        let cause: UpdatesError
        if let codeSigningError = error as? CodeSigningError {
          cause = UpdatesError.fileDownloaderCodeSigningError(cause: codeSigningError)
        } else {
          cause = UpdatesError.fileDownloaderCodeSigningUnknownError(cause: error)
        }
        self.logger.error(cause: cause, code: .unknown)
        errorBlock(cause)
        return
      }

      if signatureValidationResult.validationResult == .invalid {
        let cause = UpdatesError.fileDownloaderCodeSigningIncorrectSignature
        self.logger.error(cause: cause, code: .unknown)
        errorBlock(cause)
        return
      }

      if signatureValidationResult.validationResult != .skipped {
        if let expoProjectInformation = signatureValidationResult.expoProjectInformation {
          let update: Update
          do {
            update = try Update.update(
              withManifest: mutableManifest,
              responseHeaderData: responsePartInfo.responseHeaderData,
              extensions: extensions,
              config: config,
              database: database
            )
          } catch {
            // Catch any assertions related to parsing the manifest JSON,
            // this will ensure invalid manifests can be easily debugged.
            // For example, this will catch nullish sdkVersion assertions.
            let cause = UpdatesError.fileDownloaderManifestParseFailed(cause: error)
            self.logger.error(cause: cause, code: .unknown)
            errorBlock(cause)
            return
          }

          let manifestForProjectInformation = update.manifest
          if expoProjectInformation.projectId != manifestForProjectInformation.easProjectId() ||
            expoProjectInformation.scopeKey != manifestForProjectInformation.scopeKey() {
            let cause = UpdatesError.fileDownloaderCodeSigningCertificateScopeKeyOrProjectIdMismatch
            self.logger.error(cause: cause, code: .unknown)
            errorBlock(cause)
            return
          }
        }
        logger.info(message: "Update code signature verified successfully")
        mutableManifest["isVerified"] = true
      }
    }

    let update: Update
    do {
      update = try Update.update(
        withManifest: mutableManifest,
        responseHeaderData: responsePartInfo.responseHeaderData,
        extensions: extensions,
        config: config,
        database: database
      )
    } catch {
      // Catch any assertions related to parsing the manifest JSON,
      // this will ensure invalid manifests can be easily debugged.
      // For example, this will catch nullish sdkVersion assertions.
      let cause = UpdatesError.fileDownloaderManifestParseFailed(cause: error)
      self.logger.error(cause: cause, code: .unknown)
      errorBlock(cause)
      return
    }

    if !SelectionPolicies.doesUpdate(update, matchFilters: responsePartInfo.responseHeaderData.manifestFilters) {
      let cause = UpdatesError.fileDownloaderManifestFilterManifestMismatch
      self.logger.error(cause: cause, code: .unknown)
      errorBlock(cause)
      return
    }

    successBlock(ManifestUpdateResponsePart(updateManifest: update))
  }

  private func downloadData(
    withRequest request: URLRequest,
    progressBlock: FileDownloadProgressBlock?,
    successBlock: @escaping SuccessBlock,
    errorBlock: @escaping ErrorBlock
  ) {
    var progressObservation: NSKeyValueObservation?
    let task = session.dataTask(with: request) { data, response, error in
      // cleanup observer when task completes
      if progressObservation != nil {
        progressObservation?.invalidate()
      }
      guard let response = response else {
        let cause = UpdatesError.fileDownloaderUnknownError(cause: error!)
        self.logger.error(cause: cause, code: .unknown)
        errorBlock(cause)
        return
      }

      if let httpResponse = response as? HTTPURLResponse,
        httpResponse.statusCode < 200 || httpResponse.statusCode >= 300 {
        let encoding = FileDownloader.encoding(fromResponse: httpResponse)
        let body = data.let { it in
          String(data: it, encoding: encoding)
        } ?? "Unknown body response"
        let cause = UpdatesError.fileDownloaderHTTPResponseError(statusCode: httpResponse.statusCode, body: body)
        self.logger.error(cause: cause, code: .unknown)
        errorBlock(cause)
        return
      }

      successBlock(data, response)
    }

    if let progressBlock = progressBlock {
      progressObservation = task.progress.observe(\.fractionCompleted) { progress, _ in
        if !progress.isIndeterminate {
          progressBlock(progress.fractionCompleted)
        }
      }
    }

    task.resume()
  }

  private static func encoding(fromResponse response: URLResponse) -> String.Encoding {
    if let textEncodingName = response.textEncodingName {
      let cfEncoding = CFStringConvertIANACharSetNameToEncoding(textEncodingName as CFString)
      return String.Encoding(rawValue: CFStringConvertEncodingToNSStringEncoding(cfEncoding))
    }
    // Default to UTF-8
    return .utf8
  }
}

extension FileDownloader {
  enum DiffError: Error {
    case assetNotLaunch
    case databaseUnavailable
    case updatesDirectoryUnavailable
    case missingHeader(String)
    case invalidHeader(String)
    case launchAssetNotFound
    case baseAssetMissing(path: String)
    case failedToReadBaseAsset(cause: Error)
    case failedToWritePatch(cause: Error, path: String)
    case patchFailed(cause: Error)
    case failedToReadPatchedAsset(cause: Error)
    case failedToWritePatchedAsset(cause: Error, path: String)
    case baseHashMismatch(expected: String, actual: String)
    case patchedHashMismatch(expected: String, actual: String)
    case baseHexHashMismatch(expected: String, actual: String)
  }
}

extension FileDownloader.DiffError: CustomStringConvertible {
  var description: String {
    switch self {
    case .assetNotLaunch:
      return "Received Hermes diff for non-launch asset"
    case .databaseUnavailable:
      return "Cannot apply Hermes diff without database access"
    case .updatesDirectoryUnavailable:
      return "Cannot apply Hermes diff without updates directory"
    case let .missingHeader(header):
      return "Cannot apply Hermes diff without \(header) header"
    case let .invalidHeader(header):
      return "Invalid \(header) header"
    case .launchAssetNotFound:
      return "Launch asset not found for current update"
    case let .baseAssetMissing(path):
      return "Base asset is missing at path \(path)"
    case let .failedToReadBaseAsset(cause):
      return "Failed to read base asset: \(cause.localizedDescription)"
    case let .failedToWritePatch(cause, path):
      return "Failed to write diff to temporary file at \(path): \(cause.localizedDescription)"
    case let .patchFailed(cause):
      return "BSPatch failed: \(cause.localizedDescription)"
    case let .failedToReadPatchedAsset(cause):
      return "Failed to read patched asset: \(cause.localizedDescription)"
    case let .failedToWritePatchedAsset(cause, path):
      return "Failed to write patched asset to \(path): \(cause.localizedDescription)"
    case let .baseHashMismatch(expected, actual):
      return "Base launch asset hash mismatch; expected=\(expected) actual=\(actual)"
    case let .baseHexHashMismatch(expected, actual):
      return "Base launch asset hex hash mismatch; expected=\(expected) actual=\(actual)"
    case let .patchedHashMismatch(expected, actual):
      return "Patched asset hash mismatch; expected=\(expected) actual=\(actual)"
    }
  }
}

// swiftlint:enable force_cast
// swiftlint:enable function_parameter_count
// swiftlint:enable implicitly_unwrapped_optional
// swiftlint:enable identifier_name
// swiftlint:enable legacy_objc_type
// swiftlint:enable closure_body_length
// swiftlint:enable type_body_length
// swiftlint:enable force_unwrapping
// swiftlint:enable no_grouping_extension
// swiftlint:enable file_length
