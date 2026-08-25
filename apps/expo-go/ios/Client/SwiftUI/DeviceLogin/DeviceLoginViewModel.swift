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

  private let verificationURI: URL?
  private var serverVerificationURI: URL?
  private var authorization: DeviceAuthorization?
  private var machine: DeviceLoginStateMachine?
  private var pollTask: Task<Void, Never>?

  init(verificationURI: URL?) {
    self.verificationURI = verificationURI
  }

  /// The override page when the QR supplied one, otherwise whatever the server told us to use.
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
      Task { [weak self] in
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
    guard let username = await resolveUsername(sessionSecret: secret) else {
      phase = .failed(.invalid)
      return
    }
    await AuthenticationService.storeDeviceAuthSession(
      sessionSecret: secret,
      username: username,
      expiresAt: expiresAt
    )
    onSignedIn?()
  }

  /// The token response carries no username, and `meUserActor` is null for some actor types, so username comes from `meActor`.
  private func resolveUsername(sessionSecret: String) async -> String? {
    await APIClient.shared.setSession(sessionSecret)
    do {
      let response: MeActorResponse = try await APIClient.shared.request(Queries.getCurrentUser())
      guard let username = response.data.meActor?.username else {
        print("[DeviceLogin] meActor was null after signing in")
        return nil
      }
      return username
    } catch {
      print("[DeviceLogin] Could not resolve the username: \(error)")
      return nil
    }
  }

  /// A transport failure can be retried in place. An API refusal, like a rate limit, needs its own message.
  private func failure(for error: Error) -> DeviceLoginFailure {
    guard let loginError = error as? LoginError else {
      return .network
    }
    switch loginError {
    case .networkError:
      return .network
    case .apiError(let message), .invalidCredentials(let message):
      return .server(message)
    case .otpRequired:
      return .invalid
    }
  }
}
