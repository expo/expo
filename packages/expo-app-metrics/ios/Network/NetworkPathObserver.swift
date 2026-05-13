// Copyright 2025-present 650 Industries. All rights reserved.

import Network
import QuartzCore

protocol NetworkPathObserverDelegate: AnyObject, Sendable {
  func onNetworkPathUpdate(_ path: NetworkPath)
}

/**
 Owns one long-lived `NWPathMonitor` and converts each delivered `NWPath`
 into a `Sendable` `NetworkPath` snapshot before handing it off to the
 delegate. The monitor runs for the app lifetime — `NWPathMonitor` is cheap
 (event-driven, no polling, no radios woken) so there's no benefit to
 starting and stopping it around recording windows.
 */
final class NetworkPathObserver: Sendable {
  private let monitor = NWPathMonitor()
  private weak let delegate: NetworkPathObserverDelegate?
  private let queue = DispatchQueue(label: "expo.appmetrics.networkPath")

  init(delegate: NetworkPathObserverDelegate) {
    self.delegate = delegate
    monitor.pathUpdateHandler = { [weak self] path in
      guard let self else {
        return
      }
      let snapshot = NetworkPath.from(path, at: CACurrentMediaTime())
      self.delegate?.onNetworkPathUpdate(snapshot)
    }
    monitor.start(queue: queue)
  }

  deinit {
    monitor.cancel()
  }
}
