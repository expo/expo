// Copyright 2022-present 650 Industries. All rights reserved.

import EXUpdatesInterface
import Foundation

extension UpdatesErrorCode {
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
   Groups asset failures by their code and HTTP status, in the order each group first fails.
   */
  static func groups(of failures: [AssetLoadFailure]) -> [(code: UpdatesErrorCode, failures: [AssetLoadFailure])] {
    struct GroupKey: Hashable {
      let code: UpdatesErrorCode
      let httpStatus: Int?
    }
    var keys: [GroupKey] = []
    var failuresByKey: [GroupKey: [AssetLoadFailure]] = [:]
    for failure in failures {
      let key = GroupKey(
        code: forLoadFailure(failure.error, otherwise: .assetsFailedToLoad),
        httpStatus: httpStatus(of: failure.error)
      )
      if failuresByKey[key] == nil {
        keys.append(key)
      }
      failuresByKey[key, default: []].append(failure)
    }
    return keys.map { (code: $0.code, failures: failuresByKey[$0] ?? []) }
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

  /**
   The code for a failed update or asset load: `updateServerUnreachable` when the device could not
   reach the server, and `code` for any other failure.
   */
  static func forLoadFailure(_ error: Error, otherwise code: UpdatesErrorCode) -> UpdatesErrorCode {
    var current: Error? = error
    while let error = current {
      if let urlError = error as? URLError, serverUnreachableURLErrorCodes.contains(urlError.code) {
        return .updateServerUnreachable
      }
      current = (error as? UpdatesError)?.cause
    }
    return code
  }
}
