// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

enum DeviceLoginFailure: Equatable {
  case denied
  case wrongNumber
  case expired
  case invalid
  case network
  /// The API refused the request and said why. Carries its message so a rate limit does not get
  /// reported as a connection problem.
  case server(String)
}

/// Every timing rule the polling loop depends on, as a pure function of the previous response. `now`
/// is injected so the deadline is testable without waiting.
struct DeviceLoginStateMachine {
  enum Step: Equatable {
    case poll(after: TimeInterval, matchValue: String?)
    case awaitMatch([String])
    case signedIn(secret: String, expiresAt: Date?)
    case failed(DeviceLoginFailure)
  }

  private let deadline: Date
  private var delay: TimeInterval
  private var matchValue: String?
  private var hasSentMatch = false

  init(interval: Int, expiresIn: Int, now: Date) {
    self.delay = TimeInterval(interval)
    self.deadline = now.addingTimeInterval(TimeInterval(expiresIn))
  }

  /// The first poll waits out `interval` rather than firing immediately, so a fast browser approval
  /// cannot trip the server's three-polls-per-five-seconds limit.
  var firstStep: Step {
    .poll(after: delay, matchValue: nil)
  }

  mutating func advance(with outcome: TokenOutcome, now: Date) -> Step {
    if now >= deadline {
      return .failed(.expired)
    }

    switch outcome {
    case .session(let secret, let expiresAt):
      return .signedIn(secret: secret, expiresAt: expiresAt)
    case .pending:
      return .poll(after: delay, matchValue: matchValue)
    case .slowDown:
      // RFC 8628 section 3.5.
      delay += 5
      return .poll(after: delay, matchValue: matchValue)
    case .matchRequired(let options):
      guard !hasSentMatch else {
        return .failed(.invalid)
      }
      return .awaitMatch(options)
    case .denied:
      // The server sends access_denied both for a user denial and for a failed match. Only we know
      // whether a number was sent.
      return .failed(hasSentMatch ? .wrongNumber : .denied)
    case .expired:
      return .failed(.expired)
    case .invalid:
      return .failed(.invalid)
    }
  }

  /// The pick goes out immediately. It is also the only one the user gets, because a wrong value is
  /// terminal server-side.
  mutating func pick(_ value: String) -> Step {
    matchValue = value
    hasSentMatch = true
    return .poll(after: 0, matchValue: value)
  }
}
