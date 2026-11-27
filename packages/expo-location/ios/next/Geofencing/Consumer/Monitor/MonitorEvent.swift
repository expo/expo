import CoreLocation

@available(iOS 17, *)
extension CLMonitor.Event {
  var failure: Error? {
    if #available(iOS 18, *) {
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
    }
    if #available(iOS 17.2, *), state == .unmonitored {
      return GeofencingRegionUnmonitored(identifier)
    }
    return nil
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
  init?(_ event: CLMonitor.Event) {
    guard let geofencingEventState = GeofencingEventState(event.state) else {
      return nil
    }
    self.init(identifier: event.identifier, state: geofencingEventState, date: event.date)
  }
}
