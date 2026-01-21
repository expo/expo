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
      IPv4Address(ip.rawValue)!.debugDescription // drop interface suffix
    case .ipv6(IPv6Address.loopback):
      "localhost"
    case .ipv6(let ip):
      "[\(ip.debugDescription)]"
    default:
      nil
  }
  return hostname.map { "http://\($0):\(remotePort)" }
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

  static func getIPAddressesToScan() -> [String] {
    if isSimulator() {
      return ["localhost"]
    }

    guard let localIP = getLocalIPAddress() else {
      return ["localhost"]
    }

    let components = localIP.split(separator: ".")
    guard components.count == 4 else {
      return ["localhost"]
    }

    let subnet = components.prefix(3).joined(separator: ".")

    return [
      "localhost",
      "\(subnet).1"
    ]
  }

  static func resolveBundlerEndpoint(
    endpoint: NWEndpoint,
    queue: DispatchQueue,
  ) async throws -> String? {
    let params = NWParameters.tcp
    params.includePeerToPeer = true
    params.allowFastOpen = true
    params.allowLocalEndpointReuse = true
    params.preferNoProxies = true
    params.requiredInterface = endpoint.interface
    params.expiredDNSBehavior = NWParameters.ExpiredDNSBehavior.allow

    let connection = NWConnection(to: endpoint, using: params)
    defer { connection.cancel() }

    try await withCheckedThrowingContinuation { (cont: CheckedContinuation<Void, Error>) in
      connection.stateUpdateHandler = { state in
        let handler = connection.stateUpdateHandler
        connection.stateUpdateHandler = nil
        switch state {
          case .ready:
            cont.resume()
          case .failed(let error):
            cont.resume(throwing: error)
          case .cancelled:
            cont.resume(throwing: ConnectionError.failedConnection)
          default:
            connection.stateUpdateHandler = handler
        }
      }
      connection.start(queue: queue)
    }

    guard let host = connection.currentPath
      .flatMap({ $0.remoteEndpoint })
      .flatMap({ buildHttpHost(endpoint: $0) })
    else {
      throw ConnectionError.noPathToHost
    }

    let requestString = """
    GET /status HTTP/1.1\r
    Host: \(host)\r
    Connection: close\r
    \r

    """

    let requestData = requestString.data(using: .utf8)!

    try await withCheckedThrowingContinuation { (cont: CheckedContinuation<Void, Error>) in
      connection.send(content: requestData, completion: .contentProcessed { error in
        if let error = error {
          cont.resume(throwing: error)
        } else {
          cont.resume()
        }
      })
    }

    let responseData = try await withCheckedThrowingContinuation { (cont: CheckedContinuation<Data, Error>) in
      var responseData = Data()
      func receiveLoop() {
        connection.receive(minimumIncompleteLength: 1, maximumLength: 4096) { data, _, isComplete, error in
          if let error = error {
            cont.resume(throwing: error)
            return
          }

          if let data = data {
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

    let parts = responseString.components(separatedBy: "\r\n\r\n")
    let body = parts.dropFirst().joined(separator: "\r\n\r\n")
    if body.contains("packager-status:running") {
      return host
    } else {
      return nil
    }
  }
}
