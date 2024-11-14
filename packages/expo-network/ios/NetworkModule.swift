import ExpoModulesCore
import Network

let onNetworkStateChanged = "onNetworkStateChanged"

public final class NetworkModule: Module {
  private let monitor = NWPathMonitor()
  private let monitorQueue = DispatchQueue.global(qos: .default)

  public func definition() -> ModuleDefinition {
    Name("ExpoNetwork")

    Events(onNetworkStateChanged)

    OnStartObserving(onNetworkStateChanged) {
      setupNetworkMonitoring()
    }

    AsyncFunction("getIpAddressAsync") { () -> String? in
      return try getIPAddress()
    }

    AsyncFunction("getNetworkStateAsync") {
      return getNetworkStateAsync()
    }

    OnStopObserving(onNetworkStateChanged) {
      monitor.cancel()
    }

    OnDestroy {
      monitor.cancel()
    }
  }

  private func setupNetworkMonitoring() {
    monitor.pathUpdateHandler = { [weak self] path in
      guard let self else {
        return
      }
      self.emitNetworkStateChange(path: path)
    }
    monitor.start(queue: monitorQueue)
  }

  private func emitNetworkStateChange(path: NWPath) {
    let networkState = getNetworkStateAsync(path: path)
    sendEvent(onNetworkStateChanged, networkState)
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
        if name.starts(with: "en") {
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

  private func getNetworkStateAsync(path: NWPath? = nil) -> [String: Any] {
    let currentPath = path ?? monitor.currentPath
    let isConnected = currentPath.status == .satisfied

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
      .filter { currentPath.usesInterfaceType($0) }
      .first

    var currentNetworkType = NetworkType.unknown
    switch connectionType {
    case .wifi:
      currentNetworkType = .wifi
    case .cellular:
      currentNetworkType = .cellular
    case .wiredEthernet:
      currentNetworkType = .wiredEthernet
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
