// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import Network

struct DiscoveryResult {
  let name: String?
  let endpoint: NWEndpoint
}

enum ConnectionError: Error {
  case failedConnection
  case noPathToHost
  case invalidResponse
}

func buildHttpHost(endpoint: NWEndpoint) -> String? {
  guard case let .hostPort(remoteHost, remotePort) = endpoint else {
    return nil
  }
  let hostname: String? = switch remoteHost {
    case .name(let name, _):
      name
    case .ipv4(IPv4Address.loopback):
      "localhost"
    case .ipv4(let ip):
      IPv4Address(ip.rawValue)?.debugDescription // drop interface suffix
    case .ipv6(IPv6Address.loopback):
      "localhost"
    case .ipv6(let ip):
      "[\(ip.debugDescription)]"
    default:
      nil
  }
  return hostname.map { "http://\($0):\(remotePort)" }
}

private final class AtomicFlag: @unchecked Sendable {
  private var _value = false
  private let lock = NSLock()

  func testAndSet() -> Bool {
    lock.lock()
    defer { lock.unlock() }
    if _value { return false }
    _value = true
    return true
  }
}

func connectionStart(
  connection: NWConnection,
  queue: DispatchQueue,
  timeout: TimeInterval = 3
) async throws {
  try await withTaskCancellationHandler {
    try await withCheckedThrowingContinuation { (cont: CheckedContinuation<Void, Error>) in
      let didResume = AtomicFlag()

      let timeoutWork = DispatchWorkItem { [weak connection] in
        guard didResume.testAndSet() else { return }
        connection?.stateUpdateHandler = nil
        connection?.cancel()
        cont.resume(throwing: ConnectionError.failedConnection)
      }
      queue.asyncAfter(deadline: .now() + timeout, execute: timeoutWork)

      connection.stateUpdateHandler = { [weak connection] state in
        switch state {
        case .ready:
          timeoutWork.cancel()
          guard didResume.testAndSet() else { return }
          connection?.stateUpdateHandler = nil
          cont.resume()
        case .failed(let error):
          timeoutWork.cancel()
          guard didResume.testAndSet() else { return }
          connection?.stateUpdateHandler = nil
          cont.resume(throwing: error)
        case .cancelled:
          timeoutWork.cancel()
          guard didResume.testAndSet() else { return }
          connection?.stateUpdateHandler = nil
          cont.resume(throwing: ConnectionError.failedConnection)
        default:
          break
        }
      }
      connection.start(queue: queue)
    }
  } onCancel: {
    connection.cancel()
  }
}

func connectionSend(connection: NWConnection, message: String) async throws {
  try await withCheckedThrowingContinuation { (cont: CheckedContinuation<Void, Error>) in
    guard let data = message.data(using: .utf8) else {
      cont.resume(throwing: ConnectionError.invalidResponse)
      return
    }
    connection.send(content: data, completion: .contentProcessed { error in
      if let error {
        cont.resume(throwing: error)
      } else {
        cont.resume()
      }
    })
  }
}

func connectionReceive(_ connection: NWConnection) async throws -> String {
  let responseData = try await withCheckedThrowingContinuation { (cont: CheckedContinuation<Data, Error>) in
    var responseData = Data()
    func receiveLoop() {
      connection.receive(minimumIncompleteLength: 1, maximumLength: 4096) { data, _, isComplete, error in
        if let error {
          cont.resume(throwing: error)
          return
        }
        if let data {
          responseData.append(data)
        }
        if isComplete {
          cont.resume(returning: responseData)
        } else {
          receiveLoop()
        }
      }
    }
    receiveLoop()
  }
  guard let responseString = String(data: responseData, encoding: .utf8) else {
    throw ConnectionError.invalidResponse
  }
  return responseString
}

class NetworkUtilities {
  static func getNWBrowserResultName(_ result: NWBrowser.Result) -> String? {
    if case .bonjour(let txtRecord) = result.metadata {
      return txtRecord.getEntry(for: "name").flatMap {
        if case .string(let value) = $0 {
          value
        } else {
          nil
        }
      }
    } else {
      return nil
    }
  }

  static func resolveBundlerEndpoint(
    endpoint: NWEndpoint,
    queue: DispatchQueue,
    timeout: TimeInterval = 7
  ) async throws -> String? {
    return try await withThrowingTaskGroup(of: String?.self) { group in
      group.addTask {
        return try await performBundlerEndpointResolution(endpoint: endpoint, queue: queue)
      }

      group.addTask {
        try await Task.sleep(nanoseconds: UInt64(timeout * 1_000_000_000))
        throw ConnectionError.failedConnection
      }

      let result = try await group.next()
      group.cancelAll()
      return result ?? nil
    }
  }

  private static func performBundlerEndpointResolution(
    endpoint: NWEndpoint,
    queue: DispatchQueue
  ) async throws -> String? {
    let params = NWParameters.tcp
    params.includePeerToPeer = true
    params.allowLocalEndpointReuse = true
    params.preferNoProxies = true
    params.requiredInterface = endpoint.interface
    params.expiredDNSBehavior = NWParameters.ExpiredDNSBehavior.allow

    let connection = NWConnection(to: endpoint, using: params)
    defer { connection.cancel() }

    try await connectionStart(connection: connection, queue: queue)

    guard let host = connection.currentPath
      .flatMap({ $0.remoteEndpoint })
      .flatMap({ buildHttpHost(endpoint: $0) })
    else {
      throw ConnectionError.noPathToHost
    }

    try await connectionSend(
        connection: connection,
        message: """
        GET /status HTTP/1.1\r
        Host: \(host)\r
        Connection: close\r
        \r

        """
    )

    let responseString = try await connectionReceive(connection)
    let parts = responseString.components(separatedBy: "\r\n\r\n")
    let body = parts.dropFirst().joined(separator: "\r\n\r\n")
    if body.contains("packager-status:running") {
      return host
    } else {
      return nil
    }
  }
}
