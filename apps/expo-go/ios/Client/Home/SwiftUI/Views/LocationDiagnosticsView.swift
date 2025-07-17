import SwiftUI
import CoreLocation

struct LocationDiagnosticsView: View {
  @StateObject private var locationManager = LocationManager()
  @State private var isTracking = false
  @State private var trackingInBackground = false
  
  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 24) {
        // Location Status Section
        VStack(alignment: .leading, spacing: 12) {
          Text("Location Status")
            .font(.headline)
            .fontWeight(.semibold)
          
          LocationStatusCard(
            status: locationManager.authorizationStatus,
            accuracy: locationManager.accuracy,
            lastLocation: locationManager.lastLocation
          )
        }
        
        // Location Controls Section
        VStack(alignment: .leading, spacing: 12) {
          Text("Location Controls")
            .font(.headline)
            .fontWeight(.semibold)
          
          VStack(spacing: 16) {
            LocationControlButton(
              title: "Request Permission",
              action: {
                locationManager.requestPermission()
              }
            )
            
            LocationControlButton(
              title: isTracking ? "Stop Tracking" : "Start Tracking",
              action: {
                if isTracking {
                  locationManager.stopTracking()
                } else {
                  locationManager.startTracking()
                }
                isTracking.toggle()
              }
            )
            
            LocationControlButton(
              title: trackingInBackground ? "Stop Background Tracking" : "Start Background Tracking",
              action: {
                if trackingInBackground {
                  locationManager.stopBackgroundTracking()
                } else {
                  locationManager.startBackgroundTracking()
                }
                trackingInBackground.toggle()
              }
            )
          }
        }
        
        // Location History Section
        VStack(alignment: .leading, spacing: 12) {
          Text("Location History")
            .font(.headline)
            .fontWeight(.semibold)
          
          LocationHistoryView(locations: locationManager.locationHistory)
        }
        
        Spacer()
      }
      .padding()
    }
    .navigationTitle("Location Diagnostics")
    .navigationBarTitleDisplayMode(.inline)
  }
}

struct LocationStatusCard: View {
  let status: CLAuthorizationStatus
  let accuracy: CLLocationAccuracy
  let lastLocation: CLLocation?
  
  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Text("Authorization Status")
          .font(.body)
          .fontWeight(.medium)
        
        Spacer()
        
        Text(statusText)
          .font(.caption)
          .foregroundColor(statusColor)
      }
      
      if let location = lastLocation {
        HStack {
          Text("Last Location")
            .font(.body)
            .fontWeight(.medium)
          
          Spacer()
          
          Text("\(location.coordinate.latitude, specifier: "%.4f"), \(location.coordinate.longitude, specifier: "%.4f")")
            .font(.caption)
            .foregroundColor(.secondary)
        }
        
        HStack {
          Text("Accuracy")
            .font(.body)
            .fontWeight(.medium)
          
          Spacer()
          
          Text("\(location.horizontalAccuracy, specifier: "%.2f") m")
            .font(.caption)
            .foregroundColor(.secondary)
        }
        
        HStack {
          Text("Timestamp")
            .font(.body)
            .fontWeight(.medium)
          
          Spacer()
          
          Text(formatDate(location.timestamp))
            .font(.caption)
            .foregroundColor(.secondary)
        }
      }
    }
    .padding()
    .background(Color(.systemBackground))
    .cornerRadius(8)
    .overlay(
      RoundedRectangle(cornerRadius: 8)
        .stroke(Color(.separator), lineWidth: 0.5)
    )
  }
  
  private var statusText: String {
    switch status {
    case .notDetermined:
      return "Not Determined"
    case .denied:
      return "Denied"
    case .restricted:
      return "Restricted"
    case .authorizedWhenInUse:
      return "When In Use"
    case .authorizedAlways:
      return "Always"
    @unknown default:
      return "Unknown"
    }
  }
  
  private var statusColor: Color {
    switch status {
    case .authorizedWhenInUse, .authorizedAlways:
      return .green
    case .denied, .restricted:
      return .red
    default:
      return .orange
    }
  }
  
  private func formatDate(_ date: Date) -> String {
    let formatter = DateFormatter()
    formatter.dateStyle = .none
    formatter.timeStyle = .medium
    return formatter.string(from: date)
  }
}

struct LocationControlButton: View {
  let title: String
  let action: () -> Void
  
  var body: some View {
    Button(action: action) {
      Text(title)
        .font(.body)
        .fontWeight(.medium)
        .foregroundColor(.blue)
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
  }
}

struct LocationHistoryView: View {
  let locations: [CLLocation]
  
  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      if locations.isEmpty {
        Text("No location data available")
          .font(.body)
          .foregroundColor(.secondary)
          .padding()
      } else {
        ForEach(locations.prefix(10).indices, id: \.self) { index in
          let location = locations[index]
          LocationHistoryRow(location: location)
          
          if index < min(9, locations.count - 1) {
            Divider()
          }
        }
      }
    }
    .padding()
    .background(Color(.systemBackground))
    .cornerRadius(8)
    .overlay(
      RoundedRectangle(cornerRadius: 8)
        .stroke(Color(.separator), lineWidth: 0.5)
    )
  }
}

struct LocationHistoryRow: View {
  let location: CLLocation
  
  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Text("\(location.coordinate.latitude, specifier: "%.4f"), \(location.coordinate.longitude, specifier: "%.4f")")
        .font(.caption)
        .fontWeight(.medium)
      
      Text("Accuracy: \(location.horizontalAccuracy, specifier: "%.2f") m • \(formatDate(location.timestamp))")
        .font(.caption2)
        .foregroundColor(.secondary)
    }
  }
  
  private func formatDate(_ date: Date) -> String {
    let formatter = DateFormatter()
    formatter.dateStyle = .none
    formatter.timeStyle = .medium
    return formatter.string(from: date)
  }
}

class LocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
  private let locationManager = CLLocationManager()
  
  @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
  @Published var lastLocation: CLLocation?
  @Published var locationHistory: [CLLocation] = []
  @Published var accuracy: CLLocationAccuracy = kCLLocationAccuracyBest
  
  override init() {
    super.init()
    locationManager.delegate = self
    locationManager.desiredAccuracy = kCLLocationAccuracyBest
    authorizationStatus = locationManager.authorizationStatus
  }
  
  func requestPermission() {
    locationManager.requestWhenInUseAuthorization()
  }
  
  func startTracking() {
    locationManager.startUpdatingLocation()
  }
  
  func stopTracking() {
    locationManager.stopUpdatingLocation()
  }
  
  func startBackgroundTracking() {
    locationManager.requestAlwaysAuthorization()
    locationManager.startUpdatingLocation()
  }
  
  func stopBackgroundTracking() {
    locationManager.stopUpdatingLocation()
  }
    
  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    guard let location = locations.last else { return }
    
    DispatchQueue.main.async {
      self.lastLocation = location
      self.locationHistory.insert(location, at: 0)
      
      if self.locationHistory.count > 20 {
        self.locationHistory = Array(self.locationHistory.prefix(20))
      }
    }
  }
  
  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    print("Location error: \(error)")
  }
  
  func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
    DispatchQueue.main.async {
      self.authorizationStatus = status
    }
  }
}

struct LocationDiagnosticsView_Previews: PreviewProvider {
  static var previews: some View {
    NavigationView {
      LocationDiagnosticsView()
    }
  }
}
