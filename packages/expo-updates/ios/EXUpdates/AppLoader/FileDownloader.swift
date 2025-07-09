//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable force_cast
// swiftlint:disable function_parameter_count
// swiftlint:disable implicitly_unwrapped_optional
// swiftlint:disable identifier_name
// swiftlint:disable legacy_objc_type

import Foundation
import EASClient

public typealias SuccessBlock = (_ data: Data?, _ urlResponse: URLResponse) -> Void
public typealias ErrorBlock = (_ error: UpdatesError) -> Void
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

  // swiftlint:disable:next force_unwrapping
  private static let ParameterParserSemicolonDelimiter = ";".utf16.first!

  // these can be made non-forced lets when NSObject protocol is removed
  private var session: URLSession!
  private var sessionConfiguration: URLSessionConfiguration!
  private var config: UpdatesConfig!
  private var logger: UpdatesLogger!

  public convenience init(config: UpdatesConfig, logger: UpdatesLogger) {
    self.init(config: config, urlSessionConfiguration: URLSessionConfiguration.default, logger: logger)
  }

  required init(config: UpdatesConfig, urlSessionConfiguration: URLSessionConfiguration, logger: UpdatesLogger) {
    self.sessionConfiguration = urlSessionConfiguration
    self.config = config
    self.logger = logger
    self.session = URLSession(configuration: sessionConfiguration)
  }

  deinit {
    self.session.finishTasksAndInvalidate()
  }

  public static let assetFilesQueue: DispatchQueue = DispatchQueue(label: "expo.controller.AssetFilesQueue")

  public func downloadAsset(
    fromURL url: URL,
    verifyingHash expectedBase64URLEncodedSHA256Hash: String?,
    toPath destinationPath: String,
    extraHeaders: [String: Any],
    successBlock: @escaping HashSuccessBlock,
    errorBlock: @escaping ErrorBlock
  ) {
    downloadData(
      fromURL: url,
      extraHeaders: extraHeaders
    ) { data, response in
      guard let data = data else {
        let error = UpdatesError.fileDownloaderAssetDownloadEmptyResponse(url: url)
        self.logger.error(cause: error, code: UpdatesErrorCode.assetsFailedToLoad)
        errorBlock(error)
        return
      }

      let hashBase64String = UpdatesUtils.base64UrlEncodedSHA256WithData(data)
      if let expectedBase64URLEncodedSHA256Hash = expectedBase64URLEncodedSHA256Hash,
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
    successBlock: @escaping SuccessBlock,
    errorBlock: @escaping ErrorBlock
  ) {
    let request = createGenericRequest(withURL: url, extraHeaders: extraHeaders)
    downloadData(withRequest: request, successBlock: successBlock, errorBlock: errorBlock)
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
      withRequest: request
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

    if let launchedUpdate = launchedUpdate {
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
      guard let contentTypeParameters = EXUpdatesParameterParser().parseParameterString(
        contentType,
        withDelimiter: FileDownloader.ParameterParserSemicolonDelimiter
      ) as? [String: Any],
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
    let reader = EXUpdatesMultipartStreamReader(inputStream: InputStream(data: data), boundary: boundary)

    var manifestPartHeadersAndData: ([String: Any], Data)?
    var extensionsData: Data?
    var certificateChainStringData: Data?
    var directivePartHeadersAndData: ([String: Any], Data)?

    let completed = data.isEmpty || reader.readAllParts { headers, content, _ in
      if let contentDisposition = (headers as! [String: Any]).stringValueForCaseInsensitiveKey("content-disposition") {
        if let contentDispositionParameters = EXUpdatesParameterParser().parseParameterString(
          contentDisposition,
          withDelimiter: FileDownloader.ParameterParserSemicolonDelimiter
        ) as? [String: Any],
          let contentDispositionNameFieldValue: String = contentDispositionParameters.optionalValue(forKey: "name") {
          switch contentDispositionNameFieldValue {
          case FileDownloader.MultipartManifestPartName:
            if let headers = headers as? [String: Any], let content = content {
              manifestPartHeadersAndData = (headers, content)
            }
          case FileDownloader.MultipartDirectivePartName:
            if let headers = headers as? [String: Any], let content = content {
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
    successBlock: @escaping SuccessBlock,
    errorBlock: @escaping ErrorBlock
  ) {
    let task = session.dataTask(with: request) { data, response, error in
      guard let response = response else {
        // error is non-nil when data and response are both nil
        // swiftlint:disable:next force_unwrapping
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

// swiftlint:enable force_cast
// swiftlint:enable function_parameter_count
// swiftlint:enable implicitly_unwrapped_optional
// swiftlint:enable identifier_name
// swiftlint:enable legacy_objc_type
