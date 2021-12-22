// Copyright 2021-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal struct UnavailableError : CodedError {
  var description: String {
    "Apple authentication is not supported on this device."
  }
}

internal struct CredentialStateError: CodedError {
  let cause: String
  var description: String {
    "\(cause)"
  }
}
