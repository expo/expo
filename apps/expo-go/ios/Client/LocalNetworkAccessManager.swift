import Foundation
import Network

private let type = "_preflight_check._tcp"

@objc(EXLocalNetworkAccessManager)
class LocalNetworkAccessManager: NSObject {
  @objc static func requestAccess(completion: @escaping (Bool) -> Void) {
    Task {
      do {
        let result = try await requestLocalNetworkAuthorization()
        completion(result)
      } catch {
        completion(false)
      }
    }
  }
}

/// Code taken from https://gist.github.com/mac-cain13/fa684f54a7ae1bba8669e78d28611784
@discardableResult
func requestLocalNetworkAuthorization() async throws -> Bool {
  let queue = DispatchQueue(label: "host.exp.localNetworkAuthCheck")

  let listener = try NWListener(using: NWParameters(tls: .none, tcp: NWProtocolTCP.Options()))
  listener.service = NWListener.Service(name: UUID().uuidString, type: type)
  listener.newConnectionHandler = { _ in } // Must be set or else the listener will error with POSIX error 22

  let parameters = NWParameters()
  parameters.includePeerToPeer = true
  let browser = NWBrowser(for: .bonjour(type: type, domain: nil), using: parameters)
  // swiftlint:disable:next closure_body_length
  return try await withTaskCancellationHandler {
    // swiftlint:disable:next closure_body_length
    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Bool, Error>) in
      class LocalState {
        var didResume = false
      }
      let local = LocalState()
      @Sendable func resume(with result: Result<Bool, Error>) {
        if local.didResume {
          return
        }
        local.didResume = true

        // Teardown listener and browser
        listener.stateUpdateHandler = { _ in }
        browser.stateUpdateHandler = { _ in }
        browser.browseResultsChangedHandler = { _, _ in }
        listener.cancel()
        browser.cancel()

        continuation.resume(with: result)
      }

      // Do not setup listener/browser is we're already cancelled, it does work but logs a lot of very ugly errors
      if Task.isCancelled {
        resume(with: .failure(CancellationError()))
        return
      }

      listener.stateUpdateHandler = { newState in
        switch newState {
        case .setup:
          return
        case .ready:
          return
        case .cancelled:
          resume(with: .failure(CancellationError()))
        case .failed(let error):
          resume(with: .failure(error))
        case .waiting(let error):
          resume(with: .failure(error))
        @unknown default:
          return
        }
      }
      listener.start(queue: queue)

      browser.stateUpdateHandler = { newState in
        switch newState {
        case .setup:
          return
        case .ready:
          return
        case .cancelled:
          resume(with: .failure(CancellationError()))
        case .failed(let error):
          resume(with: .failure(error))
        case let .waiting(error):
          switch error {
          case .dns(DNSServiceErrorType(kDNSServiceErr_PolicyDenied)):
            resume(with: .success(false))
          default:
            resume(with: .failure(error))
          }
        @unknown default:
          return
        }
      }

      browser.browseResultsChangedHandler = { results, _ in
        if results.isEmpty {
          return
        }
        resume(with: .success(true))
      }
      browser.start(queue: queue)

      if Task.isCancelled {
        resume(with: .failure(CancellationError()))
        return
      }
    }
  } onCancel: {
    listener.cancel()
    browser.cancel()
  }
}
