//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable closure_body_length
// swiftlint:disable force_cast
// swiftlint:disable function_parameter_count
// swiftlint:disable implicitly_unwrapped_optional
// swiftlint:disable identifier_name
// swiftlint:disable type_body_length
// swiftlint:disable legacy_objc_type

import Foundation
import EASClient

public typealias SuccessBlock = (_ data: Data?, _ urlResponse: URLResponse) -> Void
public typealias ErrorBlock = (_ error: Error) -> Void
public typealias HashSuccessBlock = (_ data: Data, _ urlResponse: URLResponse, _ base64URLEncodedSHA256Hash: String) -> Void

internal typealias RemoteUpdateDownloadSuccessBlock = (_ updateResponse: UpdateResponse) -> Void
internal typealias RemoteUpdateDownloadErrorBlock = (_ error: Error) -> Void

private typealias ParseManifestSuccessBlock = (_ manifestUpdateResponsePart: ManifestUpdateResponsePart) -> Void
private typealias ParseManifestErrorBlock = (_ error: Error) -> Void
private typealias ParseDirectiveSuccessBlock = (_ directiveUpdateResponsePart: DirectiveUpdateResponsePart) -> Void
private typealias ParseDirectiveErrorBlock = (_ error: Error) -> Void

private let ErrorDomain = "EXUpdatesFileDownloader"
private enum FileDownloaderErrorCode: Int {
  case FileWriteError = 1002
  case ManifestVerificationError = 1003
  case FileHashMismatchError = 1004
  case NoCompatibleUpdateError = 1009
  case MismatchedManifestFiltersError = 1021
  case ManifestParseError = 1022
  case InvalidResponseError = 1040
  case ManifestStringError = 1041
  case ManifestJSONError = 1042
  case ManifestSignatureError = 1043
  case MultipartParsingError = 1044
  case MultipartMissingManifestError = 1045
  case MissingMultipartBoundaryError = 1047
  case CodeSigningSignatureError = 1048
}

enum FileDownloaderInternalError: Error {
  case extractUpdateResponseDictionaryNil
}

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

  public convenience init(config: UpdatesConfig) {
    self.init(config: config, urlSessionConfiguration: URLSessionConfiguration.default)
  }

  required init(config: UpdatesConfig, urlSessionConfiguration: URLSessionConfiguration) {
    self.sessionConfiguration = urlSessionConfiguration
    self.config = config
    self.logger = UpdatesLogger()
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
        let errorMessage = String(
          format: "Asset download response was empty for URL: %@",
          url.absoluteString
        )
        self.logger.error(message: errorMessage, code: UpdatesErrorCode.assetsFailedToLoad)
        errorBlock(NSError(
          domain: ErrorDomain,
          code: FileDownloaderErrorCode.InvalidResponseError.rawValue,
          userInfo: [NSLocalizedDescriptionKey: errorMessage]
        ))
        return
      }

      let hashBase64String = UpdatesUtils.base64UrlEncodedSHA256WithData(data)
      if let expectedBase64URLEncodedSHA256Hash = expectedBase64URLEncodedSHA256Hash,
        expectedBase64URLEncodedSHA256Hash != hashBase64String {
        let errorMessage = String(
          format: "Asset download was successful but base64url-encoded SHA-256 did not match expected; URL: %@; expected hash: %@; actual hash: %@",
          url.absoluteString,
          expectedBase64URLEncodedSHA256Hash,
          hashBase64String
        )
        self.logger.error(message: errorMessage, code: UpdatesErrorCode.assetsFailedToLoad)
        errorBlock(NSError(
          domain: ErrorDomain,
          code: FileDownloaderErrorCode.FileHashMismatchError.rawValue,
          userInfo: [NSLocalizedDescriptionKey: errorMessage]
        ))
        return
      }

      do {
        try data.write(to: URL(fileURLWithPath: destinationPath), options: .atomic)
        successBlock(data, response, hashBase64String)
        return
      } catch {
        let errorMessage = String(
          format: "Could not write downloaded asset file to path %@: %@",
          destinationPath,
          error.localizedDescription
        )
        self.logger.error(message: errorMessage, code: UpdatesErrorCode.assetsFailedToLoad)
        errorBlock(NSError(
          domain: ErrorDomain,
          code: FileDownloaderErrorCode.FileWriteError.rawValue,
          userInfo: [
            NSLocalizedDescriptionKey: errorMessage,
            NSUnderlyingErrorKey: error
          ]
        ))
        return
      }
    } errorBlock: { error in
      self.logger.error(message: error.localizedDescription, code: UpdatesErrorCode.assetsFailedToLoad)
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
        let errorMessage = "response must be a HTTPURLResponse"
        self.logger.error(message: errorMessage, code: UpdatesErrorCode.unknown)
        errorBlock(NSError(
          domain: ErrorDomain,
          code: FileDownloaderErrorCode.InvalidResponseError.rawValue,
          userInfo: [NSLocalizedDescriptionKey: errorMessage ]
        ))
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
    launchedUpdate: Update?,
    embeddedUpdate: Update?
  ) -> [String: Any] {
    let scopeKey = config.scopeKey

    var extraHeaders: [String: Any] = [:]
    do {
      extraHeaders = try database.serverDefinedHeaders(withScopeKey: scopeKey) ?? [:]
    } catch {
      NSLog("Error selecting serverDefinedHeaders from database: %@", [error.localizedDescription])
    }

    do {
      if let extraClientParams = try database.extraParams(withScopeKey: scopeKey) {
        let structuredHeaderDictionary = try StringDictionary(value: extraClientParams.mapValues({ value in
          try StringItem(value: value)
        }))
        extraHeaders["Expo-Extra-Params"] = structuredHeaderDictionary.serialize()
      }
    } catch {
      NSLog("Error adding extra params to headers: %@", [error.localizedDescription])
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
          try StringItem(value: item)
        }))
        extraHeaders["Expo-Recent-Failed-Update-IDs"] = structuredHeaderList.serialize()
      }
    } catch {
      NSLog("Error selecting failedUpdateIDs from database: %@", [error.localizedDescription])
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

    if let previousFatalError = ErrorRecovery.consumeErrorLog() {
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
      let errorMessage = "Missing body in remote update"
      logger.error(message: errorMessage, code: UpdatesErrorCode.unknown)
      errorBlock(NSError(
        domain: ErrorDomain,
        code: FileDownloaderErrorCode.InvalidResponseError.rawValue,
        userInfo: [NSLocalizedDescriptionKey: errorMessage]
      ))
      return
    }

    let contentType = httpResponse.value(forHTTPHeaderField: "content-type") ?? ""

    if contentType.lowercased().hasPrefix("multipart/") {
      guard let contentTypeParameters = EXUpdatesParameterParser().parseParameterString(
        contentType,
        withDelimiter: FileDownloader.ParameterParserSemicolonDelimiter
      ) as? [String: Any],
        let boundaryParameterValue: String = contentTypeParameters.optionalValue(forKey: "boundary") else {
        let errorMessage = "Missing boundary in multipart manifest content-type"
        logger.error(message: errorMessage, code: UpdatesErrorCode.unknown)
        errorBlock(NSError(
          domain: ErrorDomain,
          code: FileDownloaderErrorCode.MissingMultipartBoundaryError.rawValue,
          userInfo: [NSLocalizedDescriptionKey: errorMessage]
        ))
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
      let message = "Could not read multipart remote update response"
      logger.error(message: message, code: .unknown)
      errorBlock(NSError(
        domain: ErrorDomain,
        code: FileDownloaderErrorCode.MultipartParsingError.rawValue,
        userInfo: [NSLocalizedDescriptionKey: message]
      ))
      return
    }

    var extensions: [String: Any] = [:]
    if let extensionsData = extensionsData {
      let parsedExtensions: Any
      do {
        parsedExtensions = try JSONSerialization.jsonObject(with: extensionsData)
      } catch {
        errorBlock(error)
        return
      }

      guard let parsedExtensions = parsedExtensions as? [String: Any] else {
        let message = "Failed to parse multipart remote update extensions"
        logger.error(message: message, code: .unknown)
        errorBlock(NSError(
          domain: ErrorDomain,
          code: FileDownloaderErrorCode.MultipartParsingError.rawValue,
          userInfo: [NSLocalizedDescriptionKey: message]
        ))
        return
      }

      extensions = parsedExtensions
    }

    if config.enableExpoUpdatesProtocolV0CompatibilityMode && manifestPartHeadersAndData == nil {
      // swiftlint:disable:next line_length
      let message = "Multipart response missing manifest part. Manifest is required in version 0 of the expo-updates protocol. This may be due to the update being a rollback or other directive."
      logger.error(message: message, code: .unknown)
      errorBlock(NSError(
        domain: ErrorDomain,
        code: FileDownloaderErrorCode.MultipartMissingManifestError.rawValue,
        userInfo: [NSLocalizedDescriptionKey: message]
      ))
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
          signature: responsePartInfo.responsePartHeaderData.signature,
          signedData: responsePartInfo.body,
          manifestResponseCertificateChain: certificateChainFromManifestResponse
        )
      } catch {
        let codeSigningError = error as? CodeSigningError
        let message = codeSigningError?.message() ?? error.localizedDescription
        self.logger.error(message: message, code: .unknown)
        errorBlock(NSError(
          domain: ErrorDomain,
          code: FileDownloaderErrorCode.CodeSigningSignatureError.rawValue,
          userInfo: [NSLocalizedDescriptionKey: message]
        ))
        return
      }

      if signatureValidationResult.validationResult == .invalid {
        let message = "Directive download was successful, but signature was incorrect"
        self.logger.error(message: message, code: .unknown)
        errorBlock(NSError(
          domain: ErrorDomain,
          code: FileDownloaderErrorCode.CodeSigningSignatureError.rawValue,
          userInfo: [NSLocalizedDescriptionKey: message]
        ))
        return
      }

      if signatureValidationResult.validationResult != .skipped {
        if let expoProjectInformation = signatureValidationResult.expoProjectInformation {
          let directive: UpdateDirective
          do {
            directive = try UpdateDirective.fromJSONData(responsePartInfo.body)
          } catch {
            let message = "Failed to parse directive: \(error.localizedDescription)"
            self.logger.error(message: message, code: .unknown)
            errorBlock(NSError(
              domain: ErrorDomain,
              code: FileDownloaderErrorCode.ManifestParseError.rawValue,
              userInfo: [NSLocalizedDescriptionKey: message]
            ))
            return
          }

          if expoProjectInformation.projectId != directive.signingInfo?.easProjectId ||
            expoProjectInformation.scopeKey != directive.signingInfo?.scopeKey {
            let message = "Invalid certificate for directive project ID or scope key"
            self.logger.error(message: message, code: .unknown)
            errorBlock(NSError(
              domain: ErrorDomain,
              code: FileDownloaderErrorCode.CodeSigningSignatureError.rawValue,
              userInfo: [NSLocalizedDescriptionKey: message]
            ))
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
      let message = "Failed to parse directive: \(error.localizedDescription)"
      self.logger.error(message: message, code: .unknown)
      errorBlock(NSError(
        domain: ErrorDomain,
        code: FileDownloaderErrorCode.ManifestParseError.rawValue,
        userInfo: [NSLocalizedDescriptionKey: message]
      ))
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
    var manifestParseError: (any Error)?
    do {
      manifest = try JSONSerialization.jsonObject(with: responsePartInfo.body) as? [String: Any]
    } catch {
      manifestParseError = error
    }

    guard let manifest = manifest, manifestParseError == nil else {
      let message = "manifest should be a valid JSON object"
      logger.error(message: message, code: .unknown)
      errorBlock(NSError(
        domain: ErrorDomain,
        code: FileDownloaderErrorCode.ManifestJSONError.rawValue,
        userInfo: [NSLocalizedDescriptionKey: message]
      ))
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
          signature: responsePartInfo.responsePartHeaderData.signature,
          signedData: responsePartInfo.body,
          manifestResponseCertificateChain: certificateChainFromManifestResponse
        )
      } catch {
        let codeSigningError = error as? CodeSigningError
        let message = codeSigningError?.message() ?? error.localizedDescription
        self.logger.error(message: message, code: .unknown)
        errorBlock(NSError(
          domain: ErrorDomain,
          code: FileDownloaderErrorCode.CodeSigningSignatureError.rawValue,
          userInfo: [NSLocalizedDescriptionKey: message]
        ))
        return
      }

      if signatureValidationResult.validationResult == .invalid {
        let message = "Manifest download was successful, but signature was incorrect"
        self.logger.error(message: message, code: .unknown)
        errorBlock(NSError(
          domain: ErrorDomain,
          code: FileDownloaderErrorCode.CodeSigningSignatureError.rawValue,
          userInfo: [NSLocalizedDescriptionKey: message]
        ))
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
            let message = "Failed to parse manifest: \(error.localizedDescription)"
            self.logger.error(message: message, code: .unknown)
            errorBlock(NSError(
              domain: ErrorDomain,
              code: FileDownloaderErrorCode.ManifestParseError.rawValue,
              userInfo: [NSLocalizedDescriptionKey: message]
            ))
            return
          }

          let manifestForProjectInformation = update.manifest
          if expoProjectInformation.projectId != manifestForProjectInformation.easProjectId() ||
            expoProjectInformation.scopeKey != manifestForProjectInformation.scopeKey() {
            let message = "Invalid certificate for manifest project ID or scope key"
            self.logger.error(message: message, code: .unknown)
            errorBlock(NSError(
              domain: ErrorDomain,
              code: FileDownloaderErrorCode.CodeSigningSignatureError.rawValue,
              userInfo: [NSLocalizedDescriptionKey: message]
            ))
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
      let message = "Failed to parse manifest: \(error.localizedDescription)"
      self.logger.error(message: message, code: .unknown)
      errorBlock(NSError(
        domain: ErrorDomain,
        code: FileDownloaderErrorCode.ManifestParseError.rawValue,
        userInfo: [NSLocalizedDescriptionKey: message]
      ))
      return
    }

    if !SelectionPolicies.doesUpdate(update, matchFilters: responsePartInfo.responseHeaderData.manifestFilters) {
      let message = "Downloaded manifest is invalid; provides filters that do not match its content"
      self.logger.error(message: message, code: .unknown)
      errorBlock(NSError(
        domain: ErrorDomain,
        code: FileDownloaderErrorCode.MismatchedManifestFiltersError.rawValue,
        userInfo: [NSLocalizedDescriptionKey: message]
      ))
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
        let error = error!
        self.logger.error(message: error.localizedDescription, code: .unknown)
        errorBlock(error)
        return
      }

      if let httpResponse = response as? HTTPURLResponse,
        httpResponse.statusCode < 200 || httpResponse.statusCode >= 300 {
        let encoding = FileDownloader.encoding(fromResponse: httpResponse)
        let body = data.let { it in
          String(data: it, encoding: encoding)
        } ?? "Unknown body response"
        let error = FileDownloader.error(fromResponse: httpResponse, body: body)
        self.logger.error(message: error.localizedDescription, code: .unknown)
        errorBlock(error)
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

  private static func error(fromResponse response: HTTPURLResponse, body: String) -> NSError {
    return NSError(
      domain: ErrorDomain,
      code: response.statusCode,
      userInfo: [NSLocalizedDescriptionKey: body]
    )
  }
}

// swiftlint:enable closure_body_length
// swiftlint:enable force_cast
// swiftlint:enable function_parameter_count
// swiftlint:enable implicitly_unwrapped_optional
// swiftlint:enable identifier_name
// swiftlint:enable type_body_length
// swiftlint:enable legacy_objc_type
