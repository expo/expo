// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import Network

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
}
