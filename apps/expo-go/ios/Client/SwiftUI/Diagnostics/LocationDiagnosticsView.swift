//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI
import MapKit
import CoreLocation

struct LocationDiagnosticsView: View {
  @StateObject private var viewModel = LocationDiagnosticsViewModel()

  var body: some View {
    ZStack {
      if let error = viewModel.error {
        VStack(spacing: 16) {
          Text(error)
            .font(.body)
            .foregroundColor(.secondary)
            .multilineTextAlignment(.center)
            .padding()

          Button("Open Settings") {
            if let url = URL(string: UIApplication.openSettingsURLString) {
              UIApplication.shared.open(url)
            }
          }
          .padding()
          .background(Color.black)
          .foregroundColor(.white)
          .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .padding()
      } else if viewModel.initialRegion == nil {
        ProgressView("Loading...")
      } else {
        MapViewWrapper(viewModel: viewModel)
        .ignoresSafeArea(edges: .top)

        VStack {
          HStack {
            VStack(alignment: .leading, spacing: 8) {
              if viewModel.isBackgroundLocationAvailable {
                Button {
                  viewModel.toggleBackgroundIndicator()
                } label: {
                  Text(viewModel.showsBackgroundIndicator ? "Hide background indicator" : "Show background indicator")
                    .font(.caption)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                }
                .background(Color.black.opacity(0.8))
                .foregroundColor(.white)
                .clipShape(RoundedRectangle(cornerRadius: 8))
              }

              Button {
                viewModel.cycleAccuracy()
              } label: {
                Text("Accuracy: \(viewModel.accuracy.displayName)")
                  .font(.caption)
                  .padding(.horizontal, 12)
                  .padding(.vertical, 8)
              }
              .background(Color.black.opacity(0.8))
              .foregroundColor(.white)
              .clipShape(RoundedRectangle(cornerRadius: 8))
            }

            Spacer()

            Button {
              viewModel.centerMap()
            } label: {
              Image(systemName: "scope")
                .font(.system(size: 18))
                .padding(12)
            }
            .background(Color.black.opacity(0.8))
            .foregroundColor(.white)
            .clipShape(Circle())
          }
          .padding()

          Spacer()

          VStack(spacing: 8) {
            Button {
              viewModel.clearLocations()
            } label: {
              Text("Clear locations")
                .font(.subheadline)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
            }
            .background(Color.black.opacity(0.8))
            .foregroundColor(.white)
            .clipShape(RoundedRectangle(cornerRadius: 8))

            if viewModel.isBackgroundLocationAvailable {
              Button {
                viewModel.toggleTracking()
              } label: {
                Text(viewModel.isTracking ? "Stop tracking" : "Start tracking")
                  .font(.subheadline)
                  .padding(.horizontal, 16)
                  .padding(.vertical, 10)
              }
              .background(Color.black.opacity(0.8))
              .foregroundColor(.white)
              .clipShape(RoundedRectangle(cornerRadius: 8))
            }
          }
          .padding()
        }
      }
    }
    .navigationTitle("Location Diagnostics")
    .navigationBarTitleDisplayMode(.inline)
    .task {
      await viewModel.initialize()
    }
  }
}

private struct MapViewWrapper: UIViewRepresentable {
  @ObservedObject var viewModel: LocationDiagnosticsViewModel

  func makeUIView(context: Context) -> MKMapView {
    let mapView = MKMapView()
    mapView.showsUserLocation = true
    mapView.delegate = context.coordinator
    return mapView
  }

  func updateUIView(_ mapView: MKMapView, context: Context) {
    if !isRegionEqual(mapView.region, viewModel.mapRegion) {
      mapView.setRegion(viewModel.mapRegion, animated: true)
    }

    mapView.removeOverlays(mapView.overlays)
    if viewModel.trackedLocations.count > 1 {
      let polyline = MKPolyline(coordinates: viewModel.trackedLocations, count: viewModel.trackedLocations.count)
      mapView.addOverlay(polyline)
    }
  }

  func makeCoordinator() -> Coordinator {
    Coordinator(viewModel: viewModel)
  }

  fileprivate class Coordinator: NSObject, MKMapViewDelegate {
    let viewModel: LocationDiagnosticsViewModel

    init(viewModel: LocationDiagnosticsViewModel) {
      self.viewModel = viewModel
    }

    func mapView(_ mapView: MKMapView, regionDidChangeAnimated animated: Bool) {
      // Sync the map's region back to view model when user pans/zooms
      Task { @MainActor in
        viewModel.mapRegion = mapView.region
      }
    }

    func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
      if let polyline = overlay as? MKPolyline {
        let renderer = MKPolylineRenderer(polyline: polyline)
        renderer.strokeColor = .systemBlue
        renderer.lineWidth = 3
        return renderer
      }
      return MKOverlayRenderer(overlay: overlay)
    }
  }
}

private enum LocationAccuracy: CaseIterable {
  case lowest
  case low
  case balanced
  case high
  case best

  var displayName: String {
    switch self {
    case .lowest: return "Lowest"
    case .low: return "Low"
    case .balanced: return "Balanced"
    case .high: return "High"
    case .best: return "Best"
    }
  }

  var clAccuracy: CLLocationAccuracy {
    switch self {
    case .lowest: return kCLLocationAccuracyThreeKilometers
    case .low: return kCLLocationAccuracyKilometer
    case .balanced: return kCLLocationAccuracyHundredMeters
    case .high: return kCLLocationAccuracyNearestTenMeters
    case .best: return kCLLocationAccuracyBest
    }
  }
}

@MainActor
private class LocationDiagnosticsViewModel: NSObject, ObservableObject, CLLocationManagerDelegate {
  @Published var isBackgroundLocationAvailable = false
  @Published var accuracy: LocationAccuracy = .high
  @Published var isTracking = false
  @Published var showsBackgroundIndicator = false
  @Published var trackedLocations: [CLLocationCoordinate2D] = []
  @Published var initialRegion: MKCoordinateRegion?
  @Published var mapRegion: MKCoordinateRegion = MKCoordinateRegion()
  @Published var userLocation: CLLocationCoordinate2D?
  @Published var error: String?

  private let locationManager = CLLocationManager()
  private let storageKey = "expo-home-location-diagnostics-locations"

  override init() {
    super.init()
    locationManager.delegate = self
    locationManager.desiredAccuracy = accuracy.clAccuracy
  }

  func initialize() async {
    if let backgroundModes = Bundle.main.object(forInfoDictionaryKey: "UIBackgroundModes") as? [String] {
      isBackgroundLocationAvailable = backgroundModes.contains("location")
    } else {
      isBackgroundLocationAvailable = false
    }

    let authStatus = locationManager.authorizationStatus

    if authStatus == .notDetermined {
      locationManager.requestWhenInUseAuthorization()
      try? await Task.sleep(nanoseconds: 1_000_000_000)
    }

    if locationManager.authorizationStatus == .denied || locationManager.authorizationStatus == .restricted {
      error = "Location access is required to be set to 'Always' in order to use this feature. You can manually enable them at any time in the 'Location Services' section of the Settings app."
      return
    }

    trackedLocations = loadSavedLocations()
    locationManager.requestLocation()
  }

  func toggleTracking() {
    if isTracking {
      locationManager.stopUpdatingLocation()
      isTracking = false
    } else {
      trackedLocations = []
      saveLocations([])

      locationManager.startUpdatingLocation()
      if isBackgroundLocationAvailable {
        locationManager.allowsBackgroundLocationUpdates = true
      }
      isTracking = true
    }
  }

  func clearLocations() {
    trackedLocations = []
    saveLocations([])
  }

  func cycleAccuracy() {
    let currentIndex = LocationAccuracy.allCases.firstIndex(of: accuracy) ?? 0
    let nextIndex = (currentIndex + 1) % LocationAccuracy.allCases.count
    accuracy = LocationAccuracy.allCases[nextIndex]
    locationManager.desiredAccuracy = accuracy.clAccuracy

    if isTracking {
      locationManager.stopUpdatingLocation()
      locationManager.startUpdatingLocation()
    }
  }

  func toggleBackgroundIndicator() {
    showsBackgroundIndicator.toggle()
    locationManager.showsBackgroundLocationIndicator = showsBackgroundIndicator
  }

  func centerMap() {
    if let location = userLocation {
      mapRegion = createStandardRegion(center: location)
    }
  }

  nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    Task { @MainActor in
      for location in locations {
        let coord = location.coordinate
        self.userLocation = coord

        if self.isTracking {
          self.trackedLocations.append(coord)
          self.saveLocations(self.trackedLocations)
        }

        if self.initialRegion == nil {
          self.initialRegion = createStandardRegion(center: coord)
          self.mapRegion = self.initialRegion!
        }
      }
    }
  }

  nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    Task { @MainActor in
      print("Location error: \(error)")
    }
  }

  nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    Task { @MainActor in
      if manager.authorizationStatus == .authorizedWhenInUse || manager.authorizationStatus == .authorizedAlways {
        self.error = nil
        manager.requestLocation()
      }
    }
  }

  private func saveLocations(_ locations: [CLLocationCoordinate2D]) {
    let data = locations.map { ["lat": $0.latitude, "lon": $0.longitude] }
    UserDefaults.standard.set(data, forKey: storageKey)
  }

  private func loadSavedLocations() -> [CLLocationCoordinate2D] {
    guard let data = UserDefaults.standard.array(forKey: storageKey) as? [[String: Double]] else {
      return []
    }
    return data.compactMap { dict in
      guard let lat = dict["lat"], let lon = dict["lon"] else { return nil }
      return CLLocationCoordinate2D(latitude: lat, longitude: lon)
    }
  }
}
