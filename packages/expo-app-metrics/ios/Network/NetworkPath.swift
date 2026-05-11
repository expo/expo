// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation
import Network

/**
 A `Sendable` snapshot of `NWPath` distilled to the fields we care about. We
 don't pass `NWPath` itself across actor boundaries because it isn't
 `Sendable`, and a stable typed surface decouples downstream code from the
 OS API.
 */
struct NetworkPath: Sendable, Equatable {
  enum Status: String, Sendable {
    case satisfied
    case unsatisfied
    case requiresConnection
    case unknown
  }

  enum InterfaceType: String, Sendable {
    case wifi
    case cellular
    case ethernet
    case other
    case none
  }

  enum UnsatisfiedReason: String, Sendable {
    case notAvailable
    case cellularDenied
    case wifiDenied
    case localNetworkDenied
    case vpnInactive
    case unknown
  }

  let status: Status
  let interfaceType: InterfaceType
  let isExpensive: Bool
  let isConstrained: Bool
  /**
   Populated only when `status != .satisfied`. Distinguishes "no usable path"
   from "user denied cellular/wifi for this app" from "VPN configured but down."
   */
  let unsatisfiedReason: UnsatisfiedReason?
  /**
   `CACurrentMediaTime` of the snapshot. Useful for transition timing once the
   recorder lands.
   */
  let timestamp: TimeInterval
}

extension NetworkPath {
  /**
   Builds a snapshot from an `NWPath`. The current implementation reads the
   primary interface type via `usesInterfaceType(_:)` predicates because
   `NWPath` doesn't expose a single "preferred type" field.
   */
  static func from(_ path: NWPath, at timestamp: TimeInterval) -> NetworkPath {
    return NetworkPath(
      status: Status.from(path.status),
      interfaceType: InterfaceType.from(path),
      isExpensive: path.isExpensive,
      isConstrained: path.isConstrained,
      unsatisfiedReason: path.status == .satisfied ? nil : UnsatisfiedReason.from(path.unsatisfiedReason),
      timestamp: timestamp
    )
  }
}

private extension NetworkPath.Status {
  static func from(_ status: NWPath.Status) -> Self {
    switch status {
    case .satisfied:
      return .satisfied
    case .unsatisfied:
      return .unsatisfied
    case .requiresConnection:
      return .requiresConnection
    @unknown default:
      return .unknown
    }
  }
}

private extension NetworkPath.InterfaceType {
  static func from(_ path: NWPath) -> Self {
    if path.status != .satisfied {
      return .none
    }
    if path.usesInterfaceType(.wifi) {
      return .wifi
    }
    if path.usesInterfaceType(.cellular) {
      return .cellular
    }
    if path.usesInterfaceType(.wiredEthernet) {
      return .ethernet
    }
    // `.loopback` folds into `other` since the OS only reports it as primary
    // when no real network is up — already handled by the `.satisfied` check
    // above — or in unusual simulator configurations. Keeps the value set
    // aligned with Android.
    return .other
  }
}

private extension NetworkPath.UnsatisfiedReason {
  static func from(_ reason: NWPath.UnsatisfiedReason) -> Self {
    switch reason {
    case .notAvailable:
      return .notAvailable
    case .cellularDenied:
      return .cellularDenied
    case .wifiDenied:
      return .wifiDenied
    case .localNetworkDenied:
      return .localNetworkDenied
    case .vpnInactive:
      return .vpnInactive
    @unknown default:
      return .unknown
    }
  }
}
