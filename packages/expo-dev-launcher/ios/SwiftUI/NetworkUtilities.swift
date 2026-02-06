// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import Network

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
  let data = message.data(using: .utf8)!
  try await withCheckedThrowingContinuation { (cont: CheckedContinuation<Void, Error>) in
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
  // Same approach as expo-network just without throwing.
  static func getLocalIPAddress() -> String? {
    var address: String?

    var ifaddr: UnsafeMutablePointer<ifaddrs>?
    guard getifaddrs(&ifaddr) == 0 else { return nil }
    guard let firstAddr = ifaddr else { return nil }

    defer { freeifaddrs(ifaddr) }

    for ifptr in sequence(first: firstAddr, next: { $0.pointee.ifa_next }) {
      let interface = ifptr.pointee

      let addrFamily = interface.ifa_addr.pointee.sa_family
      if addrFamily == UInt8(AF_INET) {
        let name = String(cString: interface.ifa_name)

        if name == "en0" || name == "en1" {
          var hostname = [CChar](repeating: 0, count: Int(NI_MAXHOST))
          getnameinfo(
            interface.ifa_addr,
            socklen_t(interface.ifa_addr.pointee.sa_len),
            &hostname,
            socklen_t(hostname.count),
            nil,
            socklen_t(0),
            NI_NUMERICHOST
          )
          address = String(cString: hostname)
          break
        }
      }
    }

    return address
  }

  static func isSimulator() -> Bool {
    #if targetEnvironment(simulator)
    return true
    #else
    return false
    #endif
  }

  static func getLocalEndpointsToScan() -> [DiscoveryResult] {
    let portsToScan = ["8081", "8082", "8083"]
    if !isSimulator() {
      return []
    }
    return portsToScan.map { port in
      DiscoveryResult(
        name: nil,
        endpoint: NWEndpoint.hostPort(
          host: NWEndpoint.Host.init(getLocalIPAddress() ?? "localhost"),
          port: NWEndpoint.Port.init(port)!
        )
      )
    }
  }

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
