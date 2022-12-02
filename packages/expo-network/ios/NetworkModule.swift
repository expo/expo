import ExpoModulesCore
import SystemConfiguration
import Network

extension NWInterface.InterfaceType: CaseIterable {
    public static var allCases: [NWInterface.InterfaceType] = [
        .other,
        .wifi,
        .cellular,
        .loopback,
        .wiredEthernet
    ]
}

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
  private let monitor = NWPathMonitor()
  private let monitorQueue = DispatchQueue.global(qos: .background)
  private var type = NetworkType.unknown
  private var connected: Bool = false

  public func definition() -> ModuleDefinition {
    Name("ExpoNetwork")

    OnCreate {
      startMonitor()
    }

    AsyncFunction("getIpAddressAsync") { () -> String? in
      return try getIPAddress()
    }

    AsyncFunction("getNetworkStateAsync") { (promise: Promise) in
      promise.resolve([
        "type": self.type.description,
        "isConnected": self.connected,
        "isInternetReachable": self.connected
      ])
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

    guard let firstAddr = ifaddr else { return address }

    for ifptr in sequence(first: firstAddr, next: { $0.pointee.ifa_next }) {
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
  }

  private func startMonitor() {
    monitor.pathUpdateHandler = { [weak self] path in
      guard let self = self else { return }
      self.connected = path.status == .satisfied

      if !self.connected {
        self.type = .none
        return
      }

      let connectionType = NWInterface.InterfaceType.allCases.filter {
        path.usesInterfaceType($0)
      }.first

      switch connectionType {
      case .wifi:
        self.type = .wifi
      case .cellular:
        self.type = .cellular
      default:
        self.type = .unknown
      }
    }
    monitor.start(queue: monitorQueue)
  }
}
