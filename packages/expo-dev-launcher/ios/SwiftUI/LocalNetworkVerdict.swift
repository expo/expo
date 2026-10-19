// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import dnssd

enum LocalNetworkVerdict: Equatable {
  case granted
  case denied
  case misconfigured
  case undetermined
}

enum LocalNetworkClassifier {
  static func verdict(forDNSError code: Int) -> LocalNetworkVerdict {
    switch code {
    case Int(kDNSServiceErr_PolicyDenied):
      return .denied
    // Undocumented signal for a missing NSBonjourServices entry; best-effort only.
    case Int(kDNSServiceErr_NoAuth):
      return .misconfigured
    default:
      return .undetermined
    }
  }
}
