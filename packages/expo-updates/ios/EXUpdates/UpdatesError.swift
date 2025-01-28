//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable identifier_name
// swiftlint:disable line_length

public enum UpdatesError: Error, Sendable, LocalizedError {
  case fileDownloaderAssetDownloadEmptyResponse(url: URL)
  case fileDownloaderAssetMismatchedHash(url: URL, expectedBase64URLEncodedSHA256Hash: String, actualBase64URLEncodedSHA256Hash: String)
  case fileDownloaderAssetFileWriteFailed(cause: Error, destinationPath: String)
  case fileDownloaderResponseNotHTTPURLResponse
  case fileDownloaderRemoteUpdateMissingBody
  case fileDownloaderMissingMultipartBoundary
  case fileDownloaderErrorReadingMultipartResponse
  case fileDownloaderMultipartExtensionsPartParseFailed
  case fileDownloaderDirectiveParseFailed(cause: Error)
  case fileDownloaderManifestParseFailed(cause: Error?)
  case fileDownloaderMultipartMissingManifestVersion0
  case fileDownloaderCodeSigningError(cause: CodeSigningError)
  case fileDownloaderCodeSigningUnknownError(cause: Error)
  case fileDownloaderCodeSigningIncorrectSignature
  case fileDownloaderCodeSigningCertificateScopeKeyOrProjectIdMismatch
  case fileDownloaderManifestFilterManifestMismatch
  case fileDownloaderHTTPResponseError(statusCode: Int, body: String)
  case fileDownloaderServerDefinedHeaderFailure(cause: Error)
  case fileDownloaderExtraParamFailure(cause: Error)
  case fileDownloaderFailedUpdateIDsFailure(cause: Error)
  case fileDownloaderUnknownError(cause: Error)
  case remoteAppLoaderAssetMissingUrl
  case remoteAppLoaderHeaderDataError(cause: Error)
  case remoteAppLoaderUnknownError(cause: Error)
  case appLoaderFailedToLoadAllAssets
  case appLoaderUnknownError(cause: Error)
  case appLoaderTaskFailedToLaunch(cause: Error?)
  case appLoaderTaskUnexpectedErrorDuringLaunch
  case appControllerInitializationError(cause: Error)
  case errorRecoveryCrashing
  case errorRecoveryFatalException(serializedError: String)
  case errorRecoveryCouldNotWriteToLog(cause: Error)
  case appLauncherWithDatabaseAssetMissingUrl
  case appLauncherWithDatabaseAssetBundlePathNil
  case appLauncherWithDatabaseAssetCopyFailed
  case appLauncherWithDatabaseUnknownError(cause: Error)
  case appLauncherNoLaunchableUpdates(cause: Error?)
  case embeddedAppLoaderEmbeddedManifestLoadFailed
  case startupProcedureDidFinishWithError(cause: Error)
  case startupProcedureDidFinishBackgroundUpdateWithStatusWithError(cause: Error)
  case relaunchProcedureFailedToRelaunch(cause: Error)

  public var errorDescription: String? {
    switch self {
    case let .fileDownloaderAssetDownloadEmptyResponse(url):
      return "Asset download response was empty for URL: \(url)"
    case let .fileDownloaderAssetMismatchedHash(url, expectedBase64URLEncodedSHA256Hash, actualBase64URLEncodedSHA256Hash):
      return "Asset download was successful but base64url-encoded SHA-256 did not match expected; URL: \(url.absoluteString); expected hash: \(expectedBase64URLEncodedSHA256Hash); actual hash: \(actualBase64URLEncodedSHA256Hash)"
    case let .fileDownloaderAssetFileWriteFailed(cause, destinationPath):
      return "Could not write downloaded asset file to path \(destinationPath): \(cause.localizedDescription)"
    case .fileDownloaderResponseNotHTTPURLResponse:
      return "Response not HTTPURLResponse"
    case .fileDownloaderRemoteUpdateMissingBody:
      return "Missing body in remote update"
    case .fileDownloaderMissingMultipartBoundary:
      return "Missing boundary in multipart manifest content-type"
    case .fileDownloaderErrorReadingMultipartResponse:
      return "Could not read multipart remote update response"
    case .fileDownloaderMultipartExtensionsPartParseFailed:
      return "Failed to parse multipart remote update extensions"
    case let .fileDownloaderDirectiveParseFailed(cause):
      return "Failed to parse directive: \(cause.localizedDescription)"
    case let .fileDownloaderManifestParseFailed(cause):
      return "Failed to parse manifest JSON: \(cause?.localizedDescription ?? "Unknown error")"
    case .fileDownloaderMultipartMissingManifestVersion0:
      return "Multipart response missing manifest part. Manifest is required in version 0 of the expo-updates protocol. This may be due to the response being for a different protocol version."
    case let .fileDownloaderCodeSigningError(cause):
      return "Code signature validation failed: \(cause.localizedDescription)"
    case let .fileDownloaderCodeSigningUnknownError(cause):
      return "Code signature validation failed: \(cause.localizedDescription)"
    case .fileDownloaderCodeSigningIncorrectSignature:
      return "Code signing incorrect signature"
    case .fileDownloaderCodeSigningCertificateScopeKeyOrProjectIdMismatch:
      return "Code signing certificate project ID or scope key does not match project ID or scope key in response part"
    case .fileDownloaderManifestFilterManifestMismatch:
      return "Manifest filters do not match manifest content for downloaded manifest"
    case let .fileDownloaderHTTPResponseError(statusCode, body):
      return "HTTP response error \(statusCode): \(body)"
    case let .fileDownloaderServerDefinedHeaderFailure(cause):
      return "Error selecting serverDefinedHeaders from database: \(cause.localizedDescription)"
    case let .fileDownloaderExtraParamFailure(cause):
      return "Error adding extra params to headers: \(cause.localizedDescription)"
    case let .fileDownloaderFailedUpdateIDsFailure(cause):
      return "Error selecting failedUpdateIDs from database: \(cause.localizedDescription)"
    case let .fileDownloaderUnknownError(cause):
      return "Unknown error: \(cause.localizedDescription)"
    case .remoteAppLoaderAssetMissingUrl:
      return "Failed to download asset with no URL provided"
    case let .remoteAppLoaderHeaderDataError(cause):
      return "Error persisting header data to disk: \(cause.localizedDescription)"
    case .appLoaderFailedToLoadAllAssets:
      return "Failed to load all assets"
    case let .remoteAppLoaderUnknownError(cause):
      return "Unknown error: \(cause.localizedDescription)"
    case let .appLoaderUnknownError(cause):
      return "Unknown error: \(cause.localizedDescription)"
    case let .appLoaderTaskFailedToLaunch(cause):
      return "Failed to launch embedded or launchable update: \(cause?.localizedDescription ?? "")"
    case .appLoaderTaskUnexpectedErrorDuringLaunch:
      return "AppLoaderTask encountered an unexpected error and could not launch an update."
    case let .appControllerInitializationError(cause):
      return "The expo-updates system is disabled due to an error during initialization: \(cause.localizedDescription)"
    case .errorRecoveryCrashing:
      return "ErrorRecovery: could not recover from error, crashing"
    case let .errorRecoveryFatalException(serializedError):
      return "ErrorRecovery fatal exception: \(serializedError)"
    case let .errorRecoveryCouldNotWriteToLog(cause):
      return "Could not write fatal error to log: \(cause.localizedDescription)"
    case .appLauncherWithDatabaseAssetMissingUrl:
      return "Failed to download asset with no URL provided"
    case .appLauncherWithDatabaseAssetBundlePathNil:
      return "Asset bundlePath was unexpectedly nil"
    case .appLauncherWithDatabaseAssetCopyFailed:
      return "Asset copy failed"
    case let .appLauncherWithDatabaseUnknownError(cause):
      return "Unknown error: \(cause.localizedDescription)"
    case let .appLauncherNoLaunchableUpdates(cause):
      return "No launchable updates found in database: \(cause?.localizedDescription ?? "Unknown error")"
    case .embeddedAppLoaderEmbeddedManifestLoadFailed:
      return "Failed to load embedded manifest. Make sure you have configured expo-updates correctly."
    case let .startupProcedureDidFinishWithError(cause):
      return "AppController appLoaderTask didFinishWithError: \(cause.localizedDescription)"
    case let .startupProcedureDidFinishBackgroundUpdateWithStatusWithError(cause):
      return "AppController appLoaderTask didFinishBackgroundUpdateWithStatus=Error: \(cause.localizedDescription)"
    case let .relaunchProcedureFailedToRelaunch(cause):
      return "Failed to relaunch: \(cause.localizedDescription)"
    }
  }
}

// swiftlint:enable identifier_name
// swiftlint:enable line_length
