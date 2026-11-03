import CoreLocation
import Testing

@testable import ExpoLocation

private final class FakeLocationManager: CLLocationManager {
  var status: CLAuthorizationStatus = .authorizedWhenInUse

  override var authorizationStatus: CLAuthorizationStatus {
    status
  }

  override func startUpdatingLocation() {}

  override func stopUpdatingLocation() {}
}

@Suite("PositionUpdatesCompatibilitySource")
struct PositionUpdatesCompatibilitySourceTests {
  @Test
  func `given kCLErrorDenied and Location Services off then the stream finishes with LocationServicesDisabledGlobally`() async {
    let manager = FakeLocationManager()
    let source = PositionUpdatesCompatibilitySource()
    source.makeManager = { manager }
    source.isLocationServicesEnabled = { false }
    let updates = source.updates(for: .lowPower)

    source.locationManager(manager, didFailWithError: CLError(.denied))

    var iterator = updates.stream.makeAsyncIterator()
    await #expect(throws: LocationServicesDisabledGlobally.self) {
      try await iterator.next()
    }
  }

  @Test
  func `given kCLErrorDenied while still authorizedWhenInUse then the stream stays open`() async throws {
    let manager = FakeLocationManager()
    manager.status = .authorizedWhenInUse
    let source = PositionUpdatesCompatibilitySource()
    source.makeManager = { manager }
    source.isLocationServicesEnabled = { true }
    let updates = source.updates(for: .lowPower)
    let location = CLLocation(latitude: 52.23, longitude: 21.01)

    source.locationManager(manager, didFailWithError: CLError(.denied))
    source.locationManager(manager, didUpdateLocations: [location])

    var iterator = updates.stream.makeAsyncIterator()
    let first = try await iterator.next()
    #expect(first??.coordinate.latitude == 52.23)
    updates.stop()
  }
}
