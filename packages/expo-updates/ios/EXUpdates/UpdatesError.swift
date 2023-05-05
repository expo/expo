//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation

internal enum UpdatesError: LocalizedError {
  case responseErrorMissingResponse(reason: Error)
  case responseError(code: Int, body: String)
  case fileWriteError(path: String, reason: Error)
  case manifestVerificationError
  case fileHashMismatchError(expectedHash: String, actualHash: String)
  case noCompatibleUpdateError(updateUrl: String?, sdkVersion: String?)
  case mismatchedManifestFiltersError
  case manifestParseError(reason: Error)
  case emptyResponseError(url: String)
  case remoteUpdateMissingBody
  case invalidResponseTypeError
  case directiveParseError(reason: Error)
  case manifestStringError
  case manifestJSONError
  case manifestSignatureError
  case multipartParsingError
  case multipartExtensionsParseError
  case multipartMissingManifestError
  case missingMultipartBoundaryError
  case codeSigningError(reason: Error)
  case codeSigningSignatureError(part: String)
  case codeSigningCertificateExtensionMismatch
  case cryptoManifestEmptyOrMissingSignature
  case cryptoPublicKeyDownloadError
  case appLauncherAssetDownloadNoURL
  case appLauncherAssetBundlePathNil
  case appLauncherAssetCopyFailed
  case appLauncherNoLaunchableUpdates(reason: Error?)
  case appLoaderFailedToLoadEmbeddedManifest
  case appLoaderFailedToDownloadAssetNoURL
  case appLoaderFailedToLoadAllAssets
  case updatesDirectoryCreationFailed
  case appLoaderTaskUpdatesDisabled
  case appLoaderTaskNullURL
  case appLoaderTaskUnexpectedError
  case devLauncherConfigFailed
  case devLauncherInvalidUpdateURL
  case devLauncherUpdateLaunchFailed

  var errorDescription: String {
    switch self {
    case .responseErrorMissingResponse(let reason): return reason.localizedDescription
    case .responseError(let code, let body): return "HTTP Error \(code): \(body)"
    case .fileWriteError(let path, let reason): return "Could not write to path \(path): \(reason.localizedDescription)"
    case .manifestVerificationError: return "Manifest verification failed"
    case .fileHashMismatchError(let expectedHash, let actualHash): return "File download was successful but base64url-encoded SHA-256 did not match expected; expected: \(expectedHash); actual: \(actualHash)"
    case .noCompatibleUpdateError(let updateUrl, let sdkVersion): return "No compatible update found at \(updateUrl ?? "(missing config updateUrl)"). Only \(sdkVersion ?? "(missing sdkVersion field)") are supported."
    case .mismatchedManifestFiltersError: return "Downloaded manifest is invalid; provides filters that do not match its content"
    case .manifestParseError(let reason): return "Failed to parse manifest: \(reason.localizedDescription)"
    case .emptyResponseError(let url): return "File download response was empty for URL: \(url)"
    case .remoteUpdateMissingBody: return "Missing body in remote update"
    case .invalidResponseTypeError: return "Response must be a HTTPURLResponse"
    case .directiveParseError(let reason): return "Failed to parse directive: \(reason.localizedDescription)"
    case .manifestStringError: return "manifestString should be a string"
    case .manifestJSONError: return "manifest should be a valid JSON object"
    case .manifestSignatureError: return "signature should be a string"
    case .multipartParsingError: return "Could not read multipart remote update response"
    case .multipartExtensionsParseError: return "Failed to parse multipart remote update extensions"
    case .multipartMissingManifestError: return "Multipart response missing manifest part. Manifest is required in version 0 of the expo-updates protocol. This may be due to the update being a rollback or other directive."
    case .missingMultipartBoundaryError: return "Missing boundary in multipart manifest content-type"
    case .codeSigningError(let reason): return reason.localizedDescription
    case .codeSigningSignatureError(let part): return "Download of \(part) was successful, but signature was incorrect"
    case .codeSigningCertificateExtensionMismatch: return "Invalid certificate for project ID or scope key"
    case .cryptoManifestEmptyOrMissingSignature: return "Cannot verify the manifest because it is empty or has no signature."
    case .cryptoPublicKeyDownloadError: return "Public key response body empty"
    case .appLauncherAssetDownloadNoURL: return "Failed to download asset with no URL provided"
    case .appLauncherAssetBundlePathNil: return "Asset bundlePath was unexpectedly nil"
    case .appLauncherAssetCopyFailed: return "Asset copy failed"
    case .appLauncherNoLaunchableUpdates(let reason): return "No launchable updates found in database: \(reason?.localizedDescription ?? "")"
    case .appLoaderFailedToLoadEmbeddedManifest: return "Failed to load embedded manifest. Make sure you have configured expo-updates correctly."
    case .appLoaderFailedToDownloadAssetNoURL: return "Failed to download asset with no URL provided"
    case .appLoaderFailedToLoadAllAssets: return "Failed to load all assets"
    case .updatesDirectoryCreationFailed: return "Failed to create the Updates Directory; a file already exists with the required directory name"
    case .appLoaderTaskUpdatesDisabled: return "AppLoaderTask was passed a configuration object with updates disabled. You should load updates from an embedded source rather than calling AppLoaderTask, or enable updates in the configuration."
    case .appLoaderTaskNullURL: return "AppLoaderTask was passed a configuration object with a null URL. You must pass a nonnull URL in order to use AppLoaderTask to load updates."
    case .appLoaderTaskUnexpectedError: return "AppLoaderTask encountered an unexpected error and could not launch an update."
    case .devLauncherConfigFailed: return "Cannot load configuration from Expo.plist. Please ensure you've followed the setup and installation instructions for expo-updates to create Expo.plist and add it to your Xcode project."
    case .devLauncherInvalidUpdateURL: return "Failed to read stored updates: configuration object must include a valid update URL"
    case .devLauncherUpdateLaunchFailed: return "Failed to launch update with an unknown error"
    }
  }

  var failureReason: String? {
    switch self {
    case .responseErrorMissingResponse(let reason): return reason.localizedDescription
    case .fileWriteError(_, let reason): return reason.localizedDescription
    case .codeSigningError(let reason): return reason.localizedDescription
    case .directiveParseError(let reason): return reason.localizedDescription
    case .manifestParseError(let reason): return reason.localizedDescription
    default: return nil
    }
  }

  var updatesErrorCode: UpdatesErrorCode {
    switch self {
    case .fileHashMismatchError: return UpdatesErrorCode.assetsFailedToLoad
    case .emptyResponseError: return UpdatesErrorCode.assetsFailedToLoad
    case .appLoaderTaskUpdatesDisabled: return UpdatesErrorCode.updateFailedToLoad
    case .appLoaderTaskNullURL: return UpdatesErrorCode.updateFailedToLoad
    case .appLoaderTaskUnexpectedError: return UpdatesErrorCode.updateFailedToLoad
    default: return UpdatesErrorCode.unknown
    }
  }
}
