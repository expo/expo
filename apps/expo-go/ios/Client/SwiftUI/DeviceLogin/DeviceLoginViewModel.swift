// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import Combine

@MainActor
final class DeviceLoginViewModel: ObservableObject {
  enum Phase: Equatable {
    case requesting
    case awaitingBrowser
    case matching([String])
    case completing
    case failed(DeviceLoginFailure)
  }

  @Published private(set) var phase: Phase = .requesting
  @Published private(set) var userCode: String?

  /// Called once a session has been stored, so the caller can resume whatever it was doing.
  var onSignedIn: (() -> Void)?

  private let authService: AuthenticationService
  private let verificationURI: URL?
  private var serverVerificationURI: URL?
  private var authorization: DeviceAuthorization?
  private var machine: DeviceLoginStateMachine?
  private var pollTask: Task<Void, Never>?
  private var finishTask: Task<Void, Never>?

  init(authService: AuthenticationService, verificationURI: URL?) {
    self.authService = authService
    self.verificationURI = verificationURI
  }

  /// The partner's own page when the QR supplied one, otherwise whatever the server told us to use.
  var displayURI: URL? {
    verificationURI ?? serverVerificationURI
  }

  var displayOrigin: String {
    guard let host = displayURI?.host else {
      return ""
    }
    guard let path = displayURI?.path, path != "/", !path.isEmpty else {
      return host
    }
    return host + path
  }

  func start() async {
    phase = .requesting
    userCode = nil

    do {
      let authorization = try await DeviceLoginService.requestAuthorization()
      self.authorization = authorization
      self.serverVerificationURI = authorization.verificationURI
      self.userCode = authorization.userCode
      let machine = DeviceLoginStateMachine(
        interval: authorization.interval,
        expiresIn: authorization.expiresIn,
        now: Date()
      )
      let first = machine.firstStep
      self.machine = machine
      phase = .awaitingBrowser
      schedule(first)
    } catch {
      let failure = failure(for: error)
      print("[DeviceLogin] Could not start: \(failure)")
      phase = .failed(failure)
    }
  }

  func pick(_ value: String) {
    guard var machine else {
      return
    }
    let step = machine.pick(value)
    self.machine = machine
    phase = .completing
    schedule(step)
  }

  func restart() async {
    pollTask?.cancel()
    pollTask = nil
    await start()
  }

  func cancel() {
    pollTask?.cancel()
    pollTask = nil
    finishTask?.cancel()
    finishTask = nil
  }

  private func schedule(_ step: DeviceLoginStateMachine.Step) {
    switch step {
    case .poll(let after, let matchValue):
      pollTask?.cancel()
      pollTask = Task { [weak self] in
        if after > 0 {
          try? await Task.sleep(nanoseconds: UInt64(after * 1_000_000_000))
        }
        guard !Task.isCancelled else {
          return
        }
        await self?.pollOnce(matchValue: matchValue)
      }
    case .awaitMatch(let options):
      phase = .matching(options)
    case .signedIn(let secret, let expiresAt):
      finishTask = Task { [weak self] in
        await self?.finish(secret: secret, expiresAt: expiresAt)
      }
    case .failed(let failure):
      phase = .failed(failure)
    }
  }

  private func pollOnce(matchValue: String?) async {
    guard let authorization, var machine else {
      return
    }
    do {
      let outcome = try await DeviceLoginService.poll(
        deviceCode: authorization.deviceCode,
        matchValue: matchValue
      )
      // Re-checked after the await so a cancelled poll cannot write phase.
      guard !Task.isCancelled else {
        return
      }
      let step = machine.advance(with: outcome, now: Date())
      self.machine = machine
      schedule(step)
    } catch {
      guard !Task.isCancelled else {
        return
      }
      let failure = failure(for: error)
      print("[DeviceLogin] Poll failed: \(failure)")
      phase = .failed(failure)
    }
  }

  private func finish(secret: String, expiresAt: Date?) async {
    await authService.completeLogin(with: secret, expiresAt: expiresAt)
    // Re-checked after the await so a cancelled sign-in cannot still call onSignedIn.
    guard !Task.isCancelled else {
      return
    }
    guard authService.user != nil else {
      // No actor means no username, which the manifest check needs, so this is not a usable session.
      authService.signOut()
      phase = .failed(.invalid)
      return
    }
    onSignedIn?()
  }

  /// A transport failure can be retried in place. An API refusal, like a rate limit, needs its own message.
  private func failure(for error: Error) -> DeviceLoginFailure {
    guard let loginError = error as? LoginError else {
      return .network
    }
    switch loginError {
    case .networkError:
      return .network
    case .apiError(let message):
      return RESTClient.isClientAuthoredMessage(message) ? .invalid : .server(message)
    case .invalidCredentials(let message):
      return .server(message)
    case .otpRequired:
      return .invalid
    }
  }
}
