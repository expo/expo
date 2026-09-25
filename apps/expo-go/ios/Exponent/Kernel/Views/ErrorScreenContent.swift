// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc(EXFatalErrorType)
enum FatalErrorType: Int {
  case loading
  case exception
}

struct ErrorScreenContent: Equatable {
  let title: String
  let header: String?
  let detail: String?
  let fixInstructions: String?
  let showsRetry: Bool

  private static let unknownErrorPrefix = "Unknown error: "
  private static let lanHint =
    "It looks like you may be using a LAN URL. Make sure your device is on the same network as the server, "
    + "and that you have granted Expo Go the Local Network permission in the Settings app, "
    + "or try using the tunnel connection type."

  static func make(
    error: NSError?,
    type: FatalErrorType,
    manifestName: String?,
    manifestUrl: String?,
    header: String?
  ) -> ErrorScreenContent {
    let owner = manifestName.map { "\"\($0)\"" } ?? "the requested project"
    let defaultTitle = type == .loading
      ? "There was a problem loading \(owner)."
      : "There was a problem running \(owner)."
    guard let error else {
      return ErrorScreenContent(title: defaultTitle, header: nil, detail: nil, fixInstructions: nil, showsRetry: true)
    }

    var detail = error.localizedDescription
    if detail.hasPrefix(unknownErrorPrefix) {
      detail = String(detail.dropFirst(unknownErrorPrefix.count))
    }
    if type == .loading {
      if error.code == NSURLErrorNotConnectedToInternet {
        detail += " Make sure you're connected to the internet."
      } else if let manifestUrl, looksLikeLAN(manifestUrl) {
        detail += "\n\n\(lanHint)"
      }
      if let manifestUrl {
        detail += "\n\n\(manifestUrl)"
      }
    }

    return ErrorScreenContent(
      title: header ?? defaultTitle,
      header: header,
      detail: detail,
      fixInstructions: error.userInfo[EXFixInstructionsKey] as? String,
      showsRetry: (error.userInfo[EXShowTryAgainButtonKey] as? NSNumber)?.boolValue ?? true
    )
  }

  private static func looksLikeLAN(_ url: String) -> Bool {
    [".local", "192.", "10.", "172."].contains { url.contains($0) }
  }
}
