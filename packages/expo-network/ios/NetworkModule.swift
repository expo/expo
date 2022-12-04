import ExpoModulesCore
import SystemConfiguration
import Network

public final class NetworkModule: Module {
  private let monitor = NWPathMonitor()
  private let monitorQueue = DispatchQueue.global(qos: .default)

  public func definition() -> ModuleDefinition {
    Name("ExpoNetwork")

    OnCreate {
      monitor.start(queue: monitorQueue)
    }

    AsyncFunction("getIpAddressAsync") { () -> String? in
      return try getIPAddress()
    }

    AsyncFunction("getNetworkStateAsync") {
      return getNetworkStateAsync()
    }

    OnDestroy {
      monitor.cancel()
    }
  }

  private func getIPAddress() throws -> String {
    var address = "0.0.0.0"
    var ifaddr: UnsafeMutablePointer<ifaddrs>?

    let error = getifaddrs(&ifaddr)

    guard error == 0 else {
      throw IpAddressException(error)
    }

    guard let firstAddr = ifaddr else {
      return address
    }

    for ifptr in sequence(first: firstAddr, next: { $0.pointee.ifa_next }) {
      let temp = ifptr.pointee
      let family = temp.ifa_addr.pointee.sa_family

      if family == UInt8(AF_INET) {
        let name = String(cString: temp.ifa_name)
        if name == "en0" || name == "en1" {
          var hostname = [CChar](repeating: 0, count: Int(NI_MAXHOST))
          getnameinfo(
            temp.ifa_addr,
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
  }

  private func getNetworkStateAsync() -> [String: Any] {
    let path = monitor.currentPath
    let isConnected = path.status == .satisfied
    var currentNetworkType = NetworkType.unknown

    if !isConnected {
      return [
        "type": NetworkType.none.description,
        "isConnected": isConnected,
        "isInternetReachable": isConnected
      ]
    }

    let connectionType = NWInterface
      .InterfaceType
      .allCases
      .filter { path.usesInterfaceType($0) }
      .first

    switch connectionType {
    case .wifi:
      currentNetworkType = .wifi
    case .cellular:
      currentNetworkType = .cellular
    default:
      currentNetworkType = .unknown
    }

    return [
      "type": currentNetworkType.description,
      "isConnected": isConnected,
      "isInternetReachable": isConnected
    ]
  }
}
