import ExpoModulesCore
import Network

@Record
struct NetworkState {
  var type: String
  var isConnected: Bool
  var isInternetReachable: Bool
}

@ExpoModule("ExpoNetwork")
public final class NetworkModule: Module {
  let monitor = Mutex<NWPathMonitor?>(nil)
  private let monitorQueue = DispatchQueue.global(qos: .default)

  @Event("onNetworkStateChanged")
  var onNetworkStateChanged: (NetworkState) -> Void

  public override func didStartListening(event: String) {
    if event == "onNetworkStateChanged" {
      setupNetworkMonitoring()
    }
  }

  public override func didStopListening(event: String) {
    if event == "onNetworkStateChanged" {
      stopNetworkMonitoring()
    }
  }

  public override func willDestroy() {
    stopNetworkMonitoring()
  }

  @JS(.concurrent)
  func getIpAddressAsync() async throws -> String {
    return try getIPAddress()
  }

  @JS(.concurrent)
  func getNetworkStateAsync() async -> NetworkState {
    return networkState(path: await getNetworkPathAsync())
  }

  private func setupNetworkMonitoring() {
    let newMonitor = NWPathMonitor()
    newMonitor.pathUpdateHandler = { [weak self] path in
      guard let self else {
        return
      }
      self.onNetworkStateChanged(self.networkState(path: path))
    }
    monitor.withLock { monitor in
      monitor?.cancel()
      monitor = newMonitor
    }
    newMonitor.start(queue: monitorQueue)
  }

  private func stopNetworkMonitoring() {
    monitor.withLock { monitor in
      monitor?.cancel()
      monitor = nil
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
        if name.starts(with: "en") {
          var hostname = [CChar](repeating: 0, count: Int(NI_MAXHOST))
          getnameinfo(
            temp.ifa_addr,
            socklen_t(temp.ifa_addr.pointee.sa_len),
            &hostname,
            socklen_t(hostname.count),
            nil,
            socklen_t(0),
            NI_NUMERICHOST
          )
          address = String(cString: hostname)
        }
      }
    }

    freeifaddrs(ifaddr)
    return address
  }

  private func getNetworkPathAsync() async -> NWPath? {
    // create a temporary monitor to avoid interfering with the module's monitor
    // since we want to wait for the result to be updated once:
    let tempMonitor = NWPathMonitor()
    defer { tempMonitor.cancel() }

    return await withCheckedContinuation { continuation in
      // The update handler and the timeout race, and a continuation must be resumed only once.
      let isResumed = Mutex(false)
      let resume: @Sendable (NWPath?) -> Bool = { path in
        let shouldResume = isResumed.withLock { isResumed in
          defer { isResumed = true }
          return !isResumed
        }
        if shouldResume {
          continuation.resume(returning: path)
        }
        return shouldResume
      }

      // Wait max 5 seconds to avoid any locking issues if the monitor
      // doesn't get an update in time. A cancelled timer source releases its handler when the
      // cancellation completes, while a cancelled `DispatchWorkItem` keeps it until its deadline.
      let timeout = DispatchSource.makeTimerSource(queue: monitorQueue)
      timeout.schedule(deadline: .now() + 5)
      timeout.setEventHandler {
        timeout.cancel()
        if resume(nil) {
          print("Timeout waiting for network path.")
        }
      }

      tempMonitor.pathUpdateHandler = { updatedPath in
        timeout.cancel()
        _ = resume(updatedPath)
      }
      timeout.resume()
      tempMonitor.start(queue: monitorQueue)
    }
  }

  private func networkState(path: NWPath?) -> NetworkState {
    let isConnected = path?.status == .satisfied

    if !isConnected {
      return NetworkState(
        type: NetworkType.none.description,
        isConnected: isConnected,
        isInternetReachable: isConnected
      )
    }

    let connectionType = NWInterface
      .InterfaceType
      .allCases
      .filter { path?.usesInterfaceType($0) == true }
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

    return NetworkState(
      type: currentNetworkType.description,
      isConnected: isConnected,
      isInternetReachable: isConnected
    )
  }
}
