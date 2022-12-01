import ExpoModulesCore
import SystemConfiguration

enum NetworkType: CustomStringConvertible {
  case unknown, wifi, none, cellular
  
  var description: String {
    switch self {
    case .wifi:
      return "WIFI"
    case .cellular:
      return "CELLULAR"
    case .unknown:
      return "UNKNOWN"
    case .none:
      return "NONE"
    }
  }
}

public final class NetworkModule: Module {
  private var type = NetworkType.unknown
  private var lastFlags: SCNetworkReachabilityFlags?

  private var connected: Bool {
    self.type != NetworkType.unknown && self.type != NetworkType.none
  }

  public func definition() -> ModuleDefinition {
    Name("ExpoNetwork")

    AsyncFunction("getIpAddressAsync") { () -> String? in
      return try getIPAddress()
    }

    AsyncFunction("getNetworkStateAsync") { (promise: Promise) in
      let reachability = createReachabilityRef()
      let flags = self.lastFlags

      if flags?.contains(.reachable) == false || flags?.contains(.connectionRequired) != false {
        self.type = .unknown
      } else {
        self.type = .wifi
      }

      #if os(tvOS)
      if flags?.contains(.isWWAN) {
        self.type = .cellular
      }
      #endif

      promise.resolve([
        "type": self.type.description,
        "isConnected": self.connected,
        "isInternetReachable": self.connected
      ])
    }
  }
  
  
  private func getIPAddress() throws -> String {
    var address = "0.0.0.0"
    var ifaddr: UnsafeMutablePointer<ifaddrs>?

    let error = getifaddrs(&ifaddr)
    if error == 0 {
      guard let firstAddr = ifaddr else { return address }

      for ifptr in sequence(first:firstAddr , next: { $0.pointee.ifa_next }) {
        let temp = ifptr.pointee
        let family = temp.ifa_addr.pointee.sa_family

        if family == UInt8(AF_INET) {
          let name = String(cString: temp.ifa_name)
          if name == "en0" || name == "en1" {
            var hostname = [CChar](repeating: 0, count: Int(NI_MAXHOST))
            getnameinfo(temp.ifa_addr,
                        socklen_t(temp.ifa_addr.pointee.sa_len),
                        &hostname,
                        socklen_t(hostname.count),
                        nil,
                        socklen_t(0),
                        NI_NUMERICHOST)
            address = String(cString: hostname)
          }
        }
      }

      freeifaddrs(ifaddr)
      return address
    } else {
      throw IpAddressException(error)
    }
  }
  
  func createReachabilityRef() -> SCNetworkReachability? {
    var zeroAddress = sockaddr()
    zeroAddress.sa_len = UInt8(MemoryLayout<sockaddr>.size)
    zeroAddress.sa_family = sa_family_t(AF_INET)

    guard let reachability = SCNetworkReachabilityCreateWithAddress(nil, &zeroAddress) else {
      return nil
    }

    setFlags(ref: reachability)
    return reachability
  }
  
  private func setFlags(ref: SCNetworkReachability) {
    var flags = SCNetworkReachabilityFlags()
    if !SCNetworkReachabilityGetFlags(ref, &flags) {
      log.error("Could not determine flags")
    }

    self.lastFlags = flags
  }
}
