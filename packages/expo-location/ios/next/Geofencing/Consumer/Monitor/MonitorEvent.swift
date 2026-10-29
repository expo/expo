import CoreLocation

@available(iOS 17, *)
struct MonitorEvent {
  let identifier: String
  let state: CLMonitor.Event.State
  let date: Date
  let authorizationDenied: Bool
  let authorizationDeniedGlobally: Bool
  let authorizationRestricted: Bool
  let conditionLimitExceeded: Bool

  var failure: Error? {
    if conditionLimitExceeded {
      return GeofencingRegionLimitExceeded()
    }
    if authorizationRestricted {
      return LocationAuthorizationRestricted()
    }
    if authorizationDeniedGlobally {
      return LocationServicesDisabledGlobally()
    }
    if authorizationDenied {
      return LocationAuthorizationDenied()
    }
    if #available(iOS 17.2, *), state == .unmonitored {
      return GeofencingRegionUnmonitored(identifier)
    }
    return nil
  }
}

@available(iOS 17, *)
extension MonitorEvent {
  init(_ event: CLMonitor.Event) {
    identifier = event.identifier
    state = event.state
    date = event.date
    if #available(iOS 18, *) {
      authorizationDenied = event.authorizationDenied
      authorizationDeniedGlobally = event.authorizationDeniedGlobally
      authorizationRestricted = event.authorizationRestricted
      conditionLimitExceeded = event.conditionLimitExceeded
    } else {
      authorizationDenied = false
      authorizationDeniedGlobally = false
      authorizationRestricted = false
      conditionLimitExceeded = false
    }
  }
}

@available(iOS 17, *)
extension GeofencingEventState {
  init?(_ state: CLMonitor.Event.State) {
    switch state {
    case .satisfied:
      self = .inside
    case .unsatisfied:
      self = .outside
    default:
      return nil
    }
  }
}

@available(iOS 17, *)
extension GeofencingEvent {
  init?(_ event: MonitorEvent) {
    guard let geofencingEventState = GeofencingEventState(event.state) else {
      return nil
    }
    self.init(identifier: event.identifier, state: geofencingEventState, date: event.date)
  }
}
