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
      // `let`, not `var`: `firstStep` is a non-mutating computed property, so a `var` here earns a
      // "never mutated" warning.
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
      // Cancellation is checked again here, not only before the request. A task cancelled while this
      // await was in flight would otherwise still write `phase`, stomping the state a fresh restart()
      // had just set up.
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
    await AuthenticationService.storePartnerSession(
      sessionSecret: secret,
      username: username,
      expiresAt: expiresAt
    )
    onSignedIn?()
  }

  /// The token response carries no username, and `meUserActor` is null for a partner actor, so the
  /// username has to come from `meActor`.
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

  /// A transport failure is worth retrying in place. Anything the API actively refused, such as the ten
  /// device authorizations per minute per IP limit, needs its own message rather than being reported as
  /// a connection problem.
  ///
  /// `LoginError` shadows rather than overrides `localizedDescription`, because it does not conform to
  /// `LocalizedError`. A bare `error.localizedDescription` would lose the API's message.
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
