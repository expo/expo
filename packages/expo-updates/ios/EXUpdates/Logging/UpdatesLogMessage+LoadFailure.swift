// Copyright 2022-present 650 Industries. All rights reserved.

import EXUpdatesInterface
import Foundation

extension UpdatesLogMessage {
  // The URL loading errors that mean the device could not reach the server.
  private static let serverUnreachableURLErrorCodes: Set<URLError.Code> = [
    .notConnectedToInternet,
    .networkConnectionLost,
    .timedOut,
    .cannotFindHost,
    .cannotConnectToHost,
    .dnsLookupFailed,
    .dataNotAllowed,
    .internationalRoamingOff
  ]

  /**
   The key for a failed update or asset load: `unreachable` when the device could not reach the
   server, and `failed` for any other failure.
   */
  static func forLoadFailure(
    _ error: Error,
    failed: UpdatesLogMessage,
    unreachable: UpdatesLogMessage
  ) -> UpdatesLogMessage {
    return isServerUnreachable(error) ? unreachable : failed
  }

  /**
   Groups asset failures by their key and HTTP status, in the order each group first fails. The key
   is `remoteAssetsUnreachable` when the device could not reach the server, and `remoteAssetsFailed`
   for any other failure.
   */
  static func groups(
    of failures: [AssetLoadFailure]
  ) -> [(message: UpdatesLogMessage, httpStatus: Int?, failures: [AssetLoadFailure])] {
    struct GroupKey: Hashable {
      let message: UpdatesLogMessage
      let httpStatus: Int?
    }
    var keys: [GroupKey] = []
    var failuresByKey: [GroupKey: [AssetLoadFailure]] = [:]
    for failure in failures {
      let key = GroupKey(
        message: forLoadFailure(failure.error, failed: .remoteAssetsFailed, unreachable: .remoteAssetsUnreachable),
        httpStatus: httpStatus(of: failure.error)
      )
      if failuresByKey[key] == nil {
        keys.append(key)
      }
      failuresByKey[key, default: []].append(failure)
    }
    return keys.map { (message: $0.message, httpStatus: $0.httpStatus, failures: failuresByKey[$0] ?? []) }
  }

  static func isServerUnreachable(_ error: Error) -> Bool {
    var current: Error? = error
    while let error = current {
      if let urlError = error as? URLError, serverUnreachableURLErrorCodes.contains(urlError.code) {
        return true
      }
      current = (error as? UpdatesError)?.cause
    }
    return false
  }

  private static func httpStatus(of error: Error) -> Int? {
    var current: Error? = error
    while let error = current {
      if case let .fileDownloaderHTTPResponseError(statusCode, _)? = error as? UpdatesError {
        return statusCode
      }
      current = (error as? UpdatesError)?.cause
    }
    return nil
  }
}
