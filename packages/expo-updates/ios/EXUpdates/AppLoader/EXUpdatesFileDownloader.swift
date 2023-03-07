//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable closure_body_length
// swiftlint:disable file_length
// swiftlint:disable force_cast
// swiftlint:disable function_body_length
// swiftlint:disable function_parameter_count
// swiftlint:disable implicitly_unwrapped_optional
// swiftlint:disable identifier_name
// swiftlint:disable type_body_length
// swiftlint:disable legacy_objc_type

import Foundation
import EASClient

public typealias SuccessBlock = (Data, URLResponse) -> Void
public typealias ErrorBlock = (Error) -> Void
public typealias HashSuccessBlock = (Data, URLResponse, String) -> Void
public typealias ManifestSuccessBlock = (EXUpdatesUpdate) -> Void

let EXUpdatesFileDownloaderErrorDomain = "EXUpdatesFileDownloader"
enum EXUpdatesFileDownloaderErrorCode: Int {
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

extension String {
  public func truncate(toMaxLength: Int) -> String {
    if toMaxLength <= 0 {
      return ""
    } else if toMaxLength < self.count {
      let endIndex = self.index(self.startIndex, offsetBy: toMaxLength)
      return String(self[...endIndex])
    } else {
      return self
    }
  }
}

extension Dictionary where Iterator.Element == (key: String, value: Any) {
  public func stringValueForCaseInsensitiveKey(_ searchKey: Key) -> String? {
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
@objcMembers
public final class EXUpdatesFileDownloader: NSObject, URLSessionDataDelegate {
  private static let DefaultTimeoutInterval: TimeInterval = 60
  private static let MultipartManifestPartName = "manifest"
  private static let MultipartExtensionsPartName = "extensions"
  private static let MultipartCertificateChainPartName = "certificate_chain"

  // swiftlint:disable:next force_unwrapping
  private static let ParameterParserSemicolonDelimiter = ";".utf16.first!

  // these can be made non-forced lets when NSObject protocol is removed
  private var session: URLSession!
  private var sessionConfiguration: URLSessionConfiguration!
  private var config: EXUpdatesConfig!
  private var logger: UpdatesLogger!

  public convenience init(config: EXUpdatesConfig) {
    self.init(config: config, urlSessionConfiguration: URLSessionConfiguration.default)
  }

  public required init(config: EXUpdatesConfig, urlSessionConfiguration: URLSessionConfiguration) {
    super.init()
    self.sessionConfiguration = urlSessionConfiguration
    self.config = config
    self.logger = UpdatesLogger()
    self.session = URLSession(configuration: sessionConfiguration, delegate: self, delegateQueue: nil)
  }

  deinit {
    self.session.finishTasksAndInvalidate()
  }

  public static let assetFilesQueue: DispatchQueue = DispatchQueue(label: "expo.controller.AssetFilesQueue")

  public func downloadFile(
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
      let hashBase64String = EXUpdatesUtils.base64UrlEncodedSHA256(with: data)
      if let expectedBase64URLEncodedSHA256Hash = expectedBase64URLEncodedSHA256Hash,
        expectedBase64URLEncodedSHA256Hash != hashBase64String {
        let errorMessage = String(
          format: "File download was successful but base64url-encoded SHA-256 did not match expected; expected: %@; actual: %@",
          [expectedBase64URLEncodedSHA256Hash, hashBase64String]
        )
        self.logger.error(message: errorMessage, code: UpdatesErrorCode.unknown)
        errorBlock(NSError(
          domain: EXUpdatesFileDownloaderErrorDomain,
          code: EXUpdatesFileDownloaderErrorCode.FileHashMismatchError.rawValue,
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
          format: "Could not write to path %@: %@",
          [destinationPath, error.localizedDescription]
        )
        self.logger.error(message: errorMessage, code: UpdatesErrorCode.unknown)
        errorBlock(NSError(
          domain: EXUpdatesFileDownloaderErrorDomain,
          code: EXUpdatesFileDownloaderErrorCode.FileWriteError.rawValue,
          userInfo: [
            NSLocalizedDescriptionKey: errorMessage,
            NSUnderlyingErrorKey: error
          ]
        ))
        return
      }
    } errorBlock: { error in
      errorBlock(error)
    }
  }

  public func downloadData(
    fromURL url: URL,
    extraHeaders: [String: Any],
    successBlock: @escaping SuccessBlock,
    errorBlock: @escaping ErrorBlock
  ) {
    let request = createGenericRequest(withURL: url, extraHeaders: extraHeaders)
    downloadData(withRequest: request, successBlock: successBlock, errorBlock: errorBlock)
  }

  public func downloadManifest(
    fromURL url: URL,
    withDatabase database: EXUpdatesDatabase,
    extraHeaders: [String: Any]?,
    successBlock: @escaping ManifestSuccessBlock,
    errorBlock: @escaping ErrorBlock
  ) {
    let request = createManifestRequest(withURL: url, extraHeaders: extraHeaders)
    downloadData(
      withRequest: request
    ) { data, response in
      guard let response = response as? HTTPURLResponse else {
        let errorMessage = "response must be a HTTPURLResponse"
        self.logger.error(message: errorMessage, code: UpdatesErrorCode.unknown)
        errorBlock(NSError(
          domain: EXUpdatesFileDownloaderErrorDomain,
          code: EXUpdatesFileDownloaderErrorCode.InvalidResponseError.rawValue,
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
  public static func extraHeaders(
    withDatabase database: EXUpdatesDatabase,
    config: EXUpdatesConfig,
    launchedUpdate: EXUpdatesUpdate?,
    embeddedUpdate: EXUpdatesUpdate?
  ) -> [String: Any] {
    var extraHeaders: [String: Any] = [:]
    do {
      extraHeaders = try database.serverDefinedHeaders(withScopeKey: config.scopeKey.require("Must have scopeKey in config")).jsonData ?? [:]
    } catch {
      NSLog("Error selecting serverDefinedHeaders from database: %@", [error.localizedDescription])
    }

    if let launchedUpdate = launchedUpdate {
      extraHeaders["Expo-Current-Update-ID"] = launchedUpdate.updateId.uuidString.lowercased()
    }

    if let embeddedUpdate = embeddedUpdate {
      extraHeaders["Expo-Embedded-Update-ID"] = embeddedUpdate.updateId.uuidString.lowercased()
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
    EXUpdatesFileDownloader.setHTTPHeaderFields(extraHeaders, onRequest: &request)
    request.setValue("ios", forHTTPHeaderField: "Expo-Platform")
    request.setValue("1", forHTTPHeaderField: "Expo-API-Version")
    request.setValue("BARE", forHTTPHeaderField: "Expo-Updates-Environment")
    request.setValue(EASClientID.uuid().uuidString, forHTTPHeaderField: "EAS-Client-ID")

    for (key, value) in config.requestHeaders {
      request.setValue(value, forHTTPHeaderField: key)
    }
  }

  private func setManifestHTTPHeaderFields(request: inout URLRequest, extraHeaders: [String: Any?]?) {
    // apply extra headers before anything else, so they don't override preset headers
    EXUpdatesFileDownloader.setHTTPHeaderFields(extraHeaders, onRequest: &request)

    request.setValue("multipart/mixed,application/expo+json,application/json", forHTTPHeaderField: "Accept")
    request.setValue("ios", forHTTPHeaderField: "Expo-Platform")
    request.setValue("1", forHTTPHeaderField: "Expo-API-Version")
    request.setValue("BARE", forHTTPHeaderField: "Expo-Updates-Environment")
    request.setValue(EASClientID.uuid().uuidString, forHTTPHeaderField: "EAS-Client-ID")
    request.setValue("true", forHTTPHeaderField: "Expo-JSON-Error")
    request.setValue(config.expectsSignedManifest ? "true" : "false", forHTTPHeaderField: "Expo-Accept-Signature")
    request.setValue(config.releaseChannel, forHTTPHeaderField: "Expo-Release-Channel")

    if let runtimeVersion = config.runtimeVersion {
      request.setValue(runtimeVersion, forHTTPHeaderField: "Expo-Runtime-Version")
    } else {
      request.setValue(config.sdkVersion, forHTTPHeaderField: "Expo-SDK-Version")
    }

    if let previousFatalError = EXUpdatesErrorRecovery.consumeErrorLog() {
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

  public func createManifestRequest(withURL url: URL, extraHeaders: [String: Any?]?) -> URLRequest {
    var request = URLRequest(
      url: url,
      cachePolicy: self.sessionConfiguration.requestCachePolicy,
      timeoutInterval: EXUpdatesFileDownloader.DefaultTimeoutInterval
    )
    setManifestHTTPHeaderFields(request: &request, extraHeaders: extraHeaders)
    return request
  }

  public func createGenericRequest(withURL url: URL, extraHeaders: [String: Any?]) -> URLRequest {
    var request = URLRequest(
      url: url,
      cachePolicy: self.sessionConfiguration.requestCachePolicy,
      timeoutInterval: EXUpdatesFileDownloader.DefaultTimeoutInterval
    )
    setHTTPHeaderFields(request: &request, extraHeaders: extraHeaders)
    return request
  }

  // MARK: - manifest parsing

  public func parseManifestResponse(
    _ httpResponse: HTTPURLResponse,
    withData data: Data,
    database: EXUpdatesDatabase,
    successBlock: @escaping ManifestSuccessBlock,
    errorBlock: @escaping ErrorBlock
  ) {
    let headerDictionary = httpResponse.allHeaderFields as! [String: Any]
    let contentType = headerDictionary.stringValueForCaseInsensitiveKey("content-type") ?? ""

    if contentType.lowercased().hasPrefix("multipart/") {
      guard let contentTypeParameters = EXUpdatesParameterParser().parseParameterString(
        contentType,
        withDelimiter: EXUpdatesFileDownloader.ParameterParserSemicolonDelimiter
      ) as? [String: Any],
        let boundaryParameterValue: String = contentTypeParameters.optionalValue(forKey: "boundary") else {
        let errorMessage = "Missing boundary in multipart manifest content-type"
        logger.error(message: errorMessage, code: UpdatesErrorCode.unknown)
        errorBlock(NSError(
          domain: EXUpdatesFileDownloaderErrorDomain,
          code: EXUpdatesFileDownloaderErrorCode.MissingMultipartBoundaryError.rawValue,
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
    } else {
      let manifestHeaders = EXUpdatesManifestHeaders(
        protocolVersion: headerDictionary.optionalValue(forKey: "expo-protocol-version"),
        serverDefinedHeaders: headerDictionary.optionalValue(forKey: "expo-server-defined-headers"),
        manifestFilters: headerDictionary.optionalValue(forKey: "expo-manifest-filters"),
        manifestSignature: headerDictionary.optionalValue(forKey: "expo-manifest-signature"),
        signature: headerDictionary.optionalValue(forKey: "expo-signature")
      )

      parseManifestBodyData(
        data,
        manifestHeaders: manifestHeaders,
        extensions: [:],
        certificateChainFromManifestResponse: nil,
        database: database,
        successBlock: successBlock,
        errorBlock: errorBlock
      )

      return
    }
  }

  private func parseMultipartManifestResponse(
    _ httpResponse: HTTPURLResponse,
    withData data: Data,
    database: EXUpdatesDatabase,
    boundary: String,
    successBlock: @escaping ManifestSuccessBlock,
    errorBlock: @escaping ErrorBlock
  ) {
    let reader = EXUpdatesMultipartStreamReader(inputStream: InputStream(data: data), boundary: boundary)

    var manifestPartHeaders: [String: Any]?
    var manifestPartData: Data?
    var extensionsData: Data?
    var certificateChainStringData: Data?

    let completed = reader.readAllParts { headers, content, _ in
      if let contentDisposition = (headers as! [String: Any]).stringValueForCaseInsensitiveKey("content-disposition") {
        if let contentDispositionParameters = EXUpdatesParameterParser().parseParameterString(
          contentDisposition,
          withDelimiter: EXUpdatesFileDownloader.ParameterParserSemicolonDelimiter
        ) as? [String: Any],
          let contentDispositionNameFieldValue: String = contentDispositionParameters.optionalValue(forKey: "name") {
          switch contentDispositionNameFieldValue {
          case EXUpdatesFileDownloader.MultipartManifestPartName:
            manifestPartHeaders = headers as? [String: Any]
            manifestPartData = content
          case EXUpdatesFileDownloader.MultipartExtensionsPartName:
            extensionsData = content
          case EXUpdatesFileDownloader.MultipartCertificateChainPartName:
            certificateChainStringData = content
          default:
            break
          }
        }
      }
    }

    if !completed {
      let message = "Could not read multipart manifest response"
      logger.error(message: message, code: .unknown)
      errorBlock(NSError(
        domain: EXUpdatesFileDownloaderErrorDomain,
        code: EXUpdatesFileDownloaderErrorCode.MultipartParsingError.rawValue,
        userInfo: [NSLocalizedDescriptionKey: message]
      ))
      return
    }

    guard let manifestPartHeaders = manifestPartHeaders, let manifestPartData = manifestPartData else {
      let message = "Multipart manifest response missing manifest part"
      logger.error(message: message, code: .unknown)
      errorBlock(NSError(
        domain: EXUpdatesFileDownloaderErrorDomain,
        code: EXUpdatesFileDownloaderErrorCode.MultipartMissingManifestError.rawValue,
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
        let message = "Failed to parse multipart manifest extensions"
        logger.error(message: message, code: .unknown)
        errorBlock(NSError(
          domain: EXUpdatesFileDownloaderErrorDomain,
          code: EXUpdatesFileDownloaderErrorCode.MultipartParsingError.rawValue,
          userInfo: [NSLocalizedDescriptionKey: message]
        ))
        return
      }

      extensions = parsedExtensions
    }

    let certificateChain = certificateChainStringData.let { it -> String? in
      String(data: it, encoding: .utf8)
    }

    let responseHeaders = httpResponse.allHeaderFields as! [String: Any]
    let manifestHeaders = EXUpdatesManifestHeaders(
      protocolVersion: responseHeaders.optionalValue(forKey: "expo-protocol-version"),
      serverDefinedHeaders: responseHeaders.optionalValue(forKey: "expo-server-defined-headers"),
      manifestFilters: responseHeaders.optionalValue(forKey: "expo-manifest-filters"),
      manifestSignature: responseHeaders.optionalValue(forKey: "expo-manifest-signature"),
      signature: manifestPartHeaders.optionalValue(forKey: "expo-signature")
    )

    parseManifestBodyData(
      manifestPartData,
      manifestHeaders: manifestHeaders,
      extensions: extensions,
      certificateChainFromManifestResponse: certificateChain,
      database: database,
      successBlock: successBlock,
      errorBlock: errorBlock
    )
    return
  }

  func parseManifestBodyData(
    _ manifestBodyData: Data,
    manifestHeaders: EXUpdatesManifestHeaders,
    extensions: [String: Any],
    certificateChainFromManifestResponse: String?,
    database: EXUpdatesDatabase,
    successBlock: @escaping ManifestSuccessBlock,
    errorBlock: @escaping ErrorBlock
  ) {
    let headerSignature = manifestHeaders.manifestSignature

    let updateResponseDictionary: [String: Any]
    do {
      let manifestBodyJson = try JSONSerialization.jsonObject(with: manifestBodyData)
      updateResponseDictionary = try extractUpdateResponseDictionary(parsedJson: manifestBodyJson)
    } catch {
      errorBlock(error)
      return
    }

    let bodyManifestString = updateResponseDictionary["manifestString"]
    let bodySignature = updateResponseDictionary["signature"]
    let isSignatureInBody = bodyManifestString != nil && bodySignature != nil

    let signature = isSignatureInBody ? bodySignature : headerSignature
    let manifestString = isSignatureInBody ? bodyManifestString : String(data: manifestBodyData, encoding: .utf8)

    // XDL serves unsigned manifests with the `signature` key set to "UNSIGNED".
    // We should treat these manifests as unsigned rather than signed with an invalid signature.
    let isUnsignedFromXDL = signature as? String == "UNSIGNED"

    guard let manifestString = manifestString as? String else {
      let message = "manifestString should be a string"
      logger.error(message: message, code: .unknown)
      errorBlock(NSError(
        domain: EXUpdatesFileDownloaderErrorDomain,
        code: EXUpdatesFileDownloaderErrorCode.ManifestStringError.rawValue,
        userInfo: [NSLocalizedDescriptionKey: message]
      ))
      return
    }

    guard let manifestStringData = manifestString.data(using: .utf8) else {
      let message = "manifest should be a valid JSON object"
      logger.error(message: message, code: .unknown)
      errorBlock(NSError(
        domain: EXUpdatesFileDownloaderErrorDomain,
        code: EXUpdatesFileDownloaderErrorCode.ManifestJSONError.rawValue,
        userInfo: [NSLocalizedDescriptionKey: message]
      ))
      return
    }

    var manifest: [String: Any]?
    var manifestParseError: (any Error)?
    do {
      manifest = try JSONSerialization.jsonObject(with: manifestStringData) as? [String: Any]
    } catch {
      manifestParseError = error
    }

    guard let manifest = manifest, manifestParseError == nil else {
      let message = "manifest should be a valid JSON object"
      logger.error(message: message, code: .unknown)
      errorBlock(NSError(
        domain: EXUpdatesFileDownloaderErrorDomain,
        code: EXUpdatesFileDownloaderErrorCode.ManifestJSONError.rawValue,
        userInfo: [NSLocalizedDescriptionKey: message]
      ))
      return
    }

    if let signature = signature, !isUnsignedFromXDL {
      guard let signature = signature as? String else {
        let message = "signature should be a string"
        logger.error(message: message, code: .unknown)
        errorBlock(NSError(
          domain: EXUpdatesFileDownloaderErrorDomain,
          code: EXUpdatesFileDownloaderErrorCode.ManifestSignatureError.rawValue,
          userInfo: [NSLocalizedDescriptionKey: message]
        ))
        return
      }

      EXUpdatesCrypto.verifySignature(
        withData: manifestString,
        signature: signature,
        config: config
      ) { isValid in
        guard isValid else {
          let message = "Manifest verification failed"
          self.logger.error(message: message, code: .unknown)
          errorBlock(NSError(
            domain: EXUpdatesFileDownloaderErrorDomain,
            code: EXUpdatesFileDownloaderErrorCode.ManifestVerificationError.rawValue,
            userInfo: [NSLocalizedDescriptionKey: message]
          ))
          return
        }

        self.createUpdate(
          manifest: manifest,
          manifestBodyData: manifestBodyData,
          manifestHeaders: manifestHeaders,
          extensions: extensions,
          certificateChainFromManifestResponse: certificateChainFromManifestResponse,
          database: database,
          isVerified: true,
          successBlock: successBlock,
          errorBlock: errorBlock
        )
      } errorBlock: { error in
        errorBlock(error)
      }
    } else {
      createUpdate(
        manifest: manifest,
        manifestBodyData: manifestBodyData,
        manifestHeaders: manifestHeaders,
        extensions: extensions,
        certificateChainFromManifestResponse: certificateChainFromManifestResponse,
        database: database,
        isVerified: false,
        successBlock: successBlock,
        errorBlock: errorBlock
      )
    }
  }

  private func extractUpdateResponseDictionary(parsedJson: Any) throws -> [String: Any] {
    if let parsedJson = parsedJson as? [String: Any] {
      return parsedJson
    } else if let parsedJson = parsedJson as? [Any] {
      // TODO: either add support for runtimeVersion or deprecate multi-manifests
      for providedManifest in parsedJson {
        if let providedManifest = providedManifest as? [String: Any],
          let sdkVersion: String = providedManifest.optionalValue(forKey: "sdkVersion"),
          let supportedSdkVersions = config.sdkVersion?.components(separatedBy: ","),
          supportedSdkVersions.contains(sdkVersion) {
          return providedManifest
        }
      }
    }

    throw NSError(
      domain: EXUpdatesFileDownloaderErrorDomain,
      code: EXUpdatesFileDownloaderErrorCode.NoCompatibleUpdateError.rawValue,
      userInfo: [
        NSLocalizedDescriptionKey: String(
          format: "No compatible update found at %@. Only %@ are supported.",
          [config.updateUrl?.absoluteString, config.sdkVersion]
        )
      ]
    )
  }

  private func createUpdate(
    manifest: [String: Any],
    manifestBodyData: Data,
    manifestHeaders: EXUpdatesManifestHeaders,
    extensions: [String: Any],
    certificateChainFromManifestResponse: String?,
    database: EXUpdatesDatabase,
    isVerified: Bool,
    successBlock: ManifestSuccessBlock,
    errorBlock: ErrorBlock
  ) {
    var mutableManifest = manifest
    if config.expectsSignedManifest {
      // There are a few cases in Expo Go where we still want to use the unsigned manifest anyway, so don't mark it as unverified.
      mutableManifest["isVerified"] = isVerified
    }

    // check code signing if code signing is configured
    // 1. verify the code signing signature (throw if invalid)
    // 2. then, if the code signing certificate is only valid for a particular project, verify that the manifest
    //    has the correct info for code signing. If the code signing certificate doesn't specify a particular
    //    project, it is assumed to be valid for all projects
    // 3. mark the manifest as verified if both of these pass
    if let codeSigningConfiguration = config.codeSigningConfiguration {
      let signatureValidationResult: EXUpdatesSignatureValidationResult
      do {
        signatureValidationResult = try codeSigningConfiguration.validateSignature(
          signature: manifestHeaders.signature,
          signedData: manifestBodyData,
          manifestResponseCertificateChain: certificateChainFromManifestResponse
        )
      } catch {
        let message = EXUpdatesCodeSigningErrorUtils.message(forError: error as! EXUpdatesCodeSigningError)
        self.logger.error(message: message, code: .unknown)
        errorBlock(NSError(
          domain: EXUpdatesFileDownloaderErrorDomain,
          code: EXUpdatesFileDownloaderErrorCode.CodeSigningSignatureError.rawValue,
          userInfo: [NSLocalizedDescriptionKey: message]
        ))
        return
      }

      if signatureValidationResult.validationResult == .Invalid {
        let message = "Manifest download was successful, but signature was incorrect"
        self.logger.error(message: message, code: .unknown)
        errorBlock(NSError(
          domain: EXUpdatesFileDownloaderErrorDomain,
          code: EXUpdatesFileDownloaderErrorCode.CodeSigningSignatureError.rawValue,
          userInfo: [NSLocalizedDescriptionKey: message]
        ))
        return
      }

      if signatureValidationResult.validationResult != .Skipped {
        if let expoProjectInformation = signatureValidationResult.expoProjectInformation {
          let update: EXUpdatesUpdate
          do {
            update = try EXUpdatesUpdate.update(
              withManifest: mutableManifest,
              manifestHeaders: manifestHeaders,
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
              domain: EXUpdatesFileDownloaderErrorDomain,
              code: EXUpdatesFileDownloaderErrorCode.ManifestParseError.rawValue,
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
              domain: EXUpdatesFileDownloaderErrorDomain,
              code: EXUpdatesFileDownloaderErrorCode.CodeSigningSignatureError.rawValue,
              userInfo: [NSLocalizedDescriptionKey: message]
            ))
            return
          }
        }
        logger.info(message: "Update code signature verified successfully")
        mutableManifest["isVerified"] = true
      }
    }

    let update: EXUpdatesUpdate
    do {
      update = try EXUpdatesUpdate.update(
        withManifest: mutableManifest,
        manifestHeaders: manifestHeaders,
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
        domain: EXUpdatesFileDownloaderErrorDomain,
        code: EXUpdatesFileDownloaderErrorCode.ManifestParseError.rawValue,
        userInfo: [NSLocalizedDescriptionKey: message]
      ))
      return
    }

    if !EXUpdatesSelectionPolicies.doesUpdate(update, matchFilters: update.manifestFilters) {
      let message = "Downloaded manifest is invalid; provides filters that do not match its content"
      self.logger.error(message: message, code: .unknown)
      errorBlock(NSError(
        domain: EXUpdatesFileDownloaderErrorDomain,
        code: EXUpdatesFileDownloaderErrorCode.MismatchedManifestFiltersError.rawValue,
        userInfo: [NSLocalizedDescriptionKey: message]
      ))
      return
    }

    successBlock(update)
  }

  private func downloadData(
    withRequest request: URLRequest,
    successBlock: @escaping SuccessBlock,
    errorBlock: @escaping ErrorBlock
  ) {
    let task = session.dataTask(with: request) { data, response, error in
      guard let data = data, let response = response else {
        // error is non-nil when data and response are both nil
        // swiftlint:disable:next force_unwrapping
        let error = error!
        self.logger.error(message: error.localizedDescription, code: .unknown)
        errorBlock(error)
        return
      }

      if let httpResponse = response as? HTTPURLResponse,
        httpResponse.statusCode < 200 || httpResponse.statusCode >= 300 {
        let encoding = EXUpdatesFileDownloader.encoding(fromResponse: httpResponse)
        let body = String(data: data, encoding: encoding) ?? "Unknown body response"
        let error = EXUpdatesFileDownloader.error(fromResponse: httpResponse, body: body)
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
      domain: EXUpdatesFileDownloaderErrorDomain,
      code: response.statusCode,
      userInfo: [NSLocalizedDescriptionKey: body]
    )
  }

  // MARK: - NSURLSessionTaskDelegate

  public func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    willPerformHTTPRedirection response: HTTPURLResponse,
    newRequest request: URLRequest,
    completionHandler: @escaping (URLRequest?) -> Void
  ) {
    completionHandler(request)
  }

  // MARK: - URLSessionDataDelegate

  public func urlSession(
    _ session: URLSession,
    dataTask: URLSessionDataTask,
    willCacheResponse proposedResponse: CachedURLResponse,
    completionHandler: @escaping (CachedURLResponse?) -> Void
  ) {
    completionHandler(proposedResponse)
  }
}
