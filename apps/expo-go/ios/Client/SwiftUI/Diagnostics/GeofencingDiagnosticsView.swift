//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI
import MapKit
import CoreLocation
import UserNotifications

struct GeofencingDiagnosticsView: View {
  @StateObject private var viewModel = GeofencingDiagnosticsViewModel()

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
        GeofencingMapViewWrapper(
          viewModel: viewModel,
          onMapTap: { coordinate in
            viewModel.addRegion(at: coordinate)
          }
        )
        .ignoresSafeArea(edges: .top)

        VStack {
          HStack {
            Button {
              viewModel.cycleRadius()
            } label: {
              Text("Radius: \(viewModel.newRegionRadius)m")
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
            }
            .background(Color.black.opacity(0.8))
            .foregroundColor(.white)
            .clipShape(RoundedRectangle(cornerRadius: 8))

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

          Button {
            viewModel.toggleGeofencing()
          } label: {
            Text(viewModel.geofencingButtonText)
              .font(.subheadline)
              .padding(.horizontal, 16)
              .padding(.vertical, 10)
          }
          .background(viewModel.canToggleGeofencing ? Color.black.opacity(0.8) : Color.gray.opacity(0.6))
          .foregroundColor(.white)
          .clipShape(RoundedRectangle(cornerRadius: 8))
          .disabled(!viewModel.canToggleGeofencing)
          .padding()
          .frame(maxWidth: .infinity, alignment: .trailing)
        }
      }
    }
    .navigationTitle("Geofencing")
    .navigationBarTitleDisplayMode(.inline)
    .task {
      await viewModel.initialize()
    }
  }
}

private struct GeofencingMapViewWrapper: UIViewRepresentable {
  @ObservedObject var viewModel: GeofencingDiagnosticsViewModel
  let onMapTap: (CLLocationCoordinate2D) -> Void

  func makeUIView(context: Context) -> MKMapView {
    let mapView = MKMapView()
    mapView.showsUserLocation = true
    mapView.delegate = context.coordinator

    let tapGesture = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleMapTap(_:)))
    mapView.addGestureRecognizer(tapGesture)
    context.coordinator.mapView = mapView

    return mapView
  }

  func updateUIView(_ mapView: MKMapView, context: Context) {
    context.coordinator.onMapTap = onMapTap

    if !isRegionEqual(mapView.region, viewModel.mapRegion) {
      mapView.setRegion(viewModel.mapRegion, animated: true)
    }

    mapView.removeOverlays(mapView.overlays)
    for region in viewModel.geofencingRegions {
      let circle = MKCircle(center: region.coordinate, radius: region.radius)
      mapView.addOverlay(circle)
    }
  }

  func makeCoordinator() -> Coordinator {
    Coordinator(viewModel: viewModel)
  }

  fileprivate class Coordinator: NSObject, MKMapViewDelegate {
    weak var mapView: MKMapView?
    var onMapTap: ((CLLocationCoordinate2D) -> Void)?
    let viewModel: GeofencingDiagnosticsViewModel

    init(viewModel: GeofencingDiagnosticsViewModel) {
      self.viewModel = viewModel
    }

    func mapView(_ mapView: MKMapView, regionDidChangeAnimated animated: Bool) {
      Task { @MainActor in
        viewModel.mapRegion = mapView.region
      }
    }

    @objc func handleMapTap(_ gesture: UITapGestureRecognizer) {
      guard let mapView = mapView else { return }
      let point = gesture.location(in: mapView)
      let coordinate = mapView.convert(point, toCoordinateFrom: mapView)
      onMapTap?(coordinate)
    }

    func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
      if let circle = overlay as? MKCircle {
        let renderer = MKCircleRenderer(circle: circle)
        renderer.strokeColor = UIColor.systemBlue.withAlphaComponent(0.8)
        renderer.fillColor = UIColor.systemBlue.withAlphaComponent(0.2)
        renderer.lineWidth = 2
        return renderer
      }
      return MKOverlayRenderer(overlay: overlay)
    }
  }
}

private struct GeofenceRegion: Identifiable {
  let id = UUID()
  let identifier: String
  let coordinate: CLLocationCoordinate2D
  let radius: Double
}

@MainActor
private class GeofencingDiagnosticsViewModel: NSObject, ObservableObject, CLLocationManagerDelegate {
  @Published var isGeofencing = false
  @Published var newRegionRadius: Int = 50
  @Published var geofencingRegions: [GeofenceRegion] = []
  @Published var initialRegion: MKCoordinateRegion?
  @Published var mapRegion: MKCoordinateRegion = MKCoordinateRegion()
  @Published var userLocation: CLLocationCoordinate2D?
  @Published var error: String?

  private let locationManager = CLLocationManager()
  private let regionRadiuses = [30, 50, 75, 100, 150, 200]

  var canToggleGeofencing: Bool {
    isGeofencing || !geofencingRegions.isEmpty
  }

  var geofencingButtonText: String {
    if canToggleGeofencing {
      return isGeofencing ? "Stop geofencing" : "Start geofencing"
    }
    return "Select at least one region on the map"
  }

  override init() {
    super.init()
    locationManager.delegate = self
  }

  func initialize() async {
    let authStatus = locationManager.authorizationStatus

    if authStatus == .notDetermined {
      locationManager.requestWhenInUseAuthorization()
      try? await Task.sleep(nanoseconds: 1_000_000_000)
    }

    if locationManager.authorizationStatus == .denied || locationManager.authorizationStatus == .restricted {
      error = "Location permissions are required in order to use this feature. You can manually enable them at any time in the 'Location Services' section of the Settings app."
      return
    }

    let center = UNUserNotificationCenter.current()
    _ = try? await center.requestAuthorization(options: [.alert, .sound])

    locationManager.requestLocation()
  }

  func addRegion(at coordinate: CLLocationCoordinate2D) {
    let identifier = "\(coordinate.latitude),\(coordinate.longitude)"
    let region = GeofenceRegion(
      identifier: identifier,
      coordinate: coordinate,
      radius: Double(newRegionRadius)
    )
    geofencingRegions.append(region)

    if isGeofencing {
      startMonitoring(region: region)
    }
  }

  func toggleGeofencing() {
    guard canToggleGeofencing else { return }

    if isGeofencing {
      stopGeofencing()
    } else {
      startGeofencing()
    }
  }

  func cycleRadius() {
    let currentIndex = regionRadiuses.firstIndex(of: newRegionRadius) ?? 0
    let nextIndex = (currentIndex + 1) % regionRadiuses.count
    newRegionRadius = regionRadiuses[nextIndex]
  }

  func centerMap() {
    if let location = userLocation {
      mapRegion = createStandardRegion(center: location)
    }
  }

  private func startGeofencing() {
    for region in geofencingRegions {
      startMonitoring(region: region)
    }
    isGeofencing = true
  }

  private func stopGeofencing() {
    for monitoredRegion in locationManager.monitoredRegions {
      locationManager.stopMonitoring(for: monitoredRegion)
    }
    geofencingRegions = []
    isGeofencing = false
  }

  private func startMonitoring(region: GeofenceRegion) {
    let clRegion = CLCircularRegion(
      center: region.coordinate,
      radius: region.radius,
      identifier: region.identifier
    )
    clRegion.notifyOnEntry = true
    clRegion.notifyOnExit = true
    locationManager.startMonitoring(for: clRegion)
  }

  nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    Task { @MainActor in
      if let location = locations.first {
        let coord = location.coordinate
        self.userLocation = coord

        if self.initialRegion == nil {
          self.initialRegion = createStandardRegion(center: coord)
          self.mapRegion = self.initialRegion!
        }
      }
    }
  }

  nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
  }

  nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    Task { @MainActor in
      if manager.authorizationStatus == .authorizedWhenInUse || manager.authorizationStatus == .authorizedAlways {
        self.error = nil
        manager.requestLocation()
      }
    }
  }

  nonisolated func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion) {
    Task { @MainActor in
      if let circularRegion = region as? CLCircularRegion {
        self.showNotification(
          title: "Entered Region",
          body: "You've entered a region with latitude: \(circularRegion.center.latitude), longitude: \(circularRegion.center.longitude) and radius: \(Int(circularRegion.radius))m"
        )
      }
    }
  }

  nonisolated func locationManager(_ manager: CLLocationManager, didExitRegion region: CLRegion) {
    Task { @MainActor in
      if let circularRegion = region as? CLCircularRegion {
        self.showNotification(
          title: "Exited Region",
          body: "You've exited a region with latitude: \(circularRegion.center.latitude), longitude: \(circularRegion.center.longitude) and radius: \(Int(circularRegion.radius))m"
        )
      }
    }
  }

  private func showNotification(title: String, body: String) {
    let content = UNMutableNotificationContent()
    content.title = title
    content.body = body
    content.sound = .default

    let request = UNNotificationRequest(
      identifier: UUID().uuidString,
      content: content,
      trigger: nil
    )

    UNUserNotificationCenter.current().add(request)
  }
}
