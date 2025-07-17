import SwiftUI
import CoreLocation

struct GeofencingDiagnosticsView: View {
  @StateObject private var geofenceManager = GeofenceManager()
  @State private var showingAddGeofence = false
  
  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 24) {
        // Geofencing Status Section
        VStack(alignment: .leading, spacing: 12) {
          Text("Geofencing Status")
            .font(.headline)
            .fontWeight(.semibold)
          
          GeofenceStatusCard(
            authorizationStatus: geofenceManager.authorizationStatus,
            isMonitoring: geofenceManager.isMonitoring,
            monitoredRegions: geofenceManager.monitoredRegions
          )
        }
        
        // Geofence Controls Section
        VStack(alignment: .leading, spacing: 12) {
          HStack {
            Text("Geofence Regions")
              .font(.headline)
              .fontWeight(.semibold)
            
            Spacer()
            
            Button("Add Region") {
              showingAddGeofence = true
            }
            .font(.system(size: 14, weight: .semibold))
            .foregroundColor(.blue)
          }
          
          GeofenceRegionsList(
            regions: geofenceManager.geofenceRegions,
            onRemove: { region in
              geofenceManager.removeGeofence(region)
            }
          )
        }
        
        // Geofence Events Section
        VStack(alignment: .leading, spacing: 12) {
          Text("Geofence Events")
            .font(.headline)
            .fontWeight(.semibold)
          
          GeofenceEventsView(events: geofenceManager.geofenceEvents)
        }
        
        Spacer()
      }
      .padding()
    }
    .navigationTitle("Geofencing")
    .navigationBarTitleDisplayMode(.inline)
    .sheet(isPresented: $showingAddGeofence) {
      AddGeofenceView(onAdd: { region in
        geofenceManager.addGeofence(region)
      })
    }
  }
}

struct GeofenceStatusCard: View {
  let authorizationStatus: CLAuthorizationStatus
  let isMonitoring: Bool
  let monitoredRegions: Int
  
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
      
      HStack {
        Text("Monitoring Status")
          .font(.body)
          .fontWeight(.medium)
        
        Spacer()
        
        Text(isMonitoring ? "Active" : "Inactive")
          .font(.caption)
          .foregroundColor(isMonitoring ? .green : .red)
      }
      
      HStack {
        Text("Monitored Regions")
          .font(.body)
          .fontWeight(.medium)
        
        Spacer()
        
        Text("\(monitoredRegions)")
          .font(.caption)
          .foregroundColor(.secondary)
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
    switch authorizationStatus {
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
    switch authorizationStatus {
    case .authorizedAlways:
      return .green
    case .authorizedWhenInUse:
      return .orange
    case .denied, .restricted:
      return .red
    default:
      return .gray
    }
  }
}

struct GeofenceRegionsList: View {
  let regions: [GeofenceRegion]
  let onRemove: (GeofenceRegion) -> Void
  
  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      if regions.isEmpty {
        Text("No geofence regions added")
          .font(.body)
          .foregroundColor(.secondary)
          .padding()
      } else {
        ForEach(regions.indices, id: \.self) { index in
          let region = regions[index]
          GeofenceRegionRow(region: region) {
            onRemove(region)
          }
          
          if index < regions.count - 1 {
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

struct GeofenceRegionRow: View {
  let region: GeofenceRegion
  let onRemove: () -> Void
  
  var body: some View {
    HStack {
      VStack(alignment: .leading, spacing: 4) {
        Text(region.name)
          .font(.body)
          .fontWeight(.medium)
        
        Text("\(region.latitude, specifier: "%.4f"), \(region.longitude, specifier: "%.4f")")
          .font(.caption)
          .foregroundColor(.secondary)
        
        Text("Radius: \(region.radius, specifier: "%.0f") m")
          .font(.caption)
          .foregroundColor(.secondary)
      }
      
      Spacer()
      
      Button("Remove") {
        onRemove()
      }
      .font(.caption)
      .foregroundColor(.red)
    }
  }
}

struct GeofenceEventsView: View {
  let events: [GeofenceEvent]
  
  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      if events.isEmpty {
        Text("No geofence events recorded")
          .font(.body)
          .foregroundColor(.secondary)
          .padding()
      } else {
        ForEach(events.prefix(10).indices, id: \.self) { index in
          let event = events[index]
          GeofenceEventRow(event: event)
          
          if index < min(9, events.count - 1) {
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

struct GeofenceEventRow: View {
  let event: GeofenceEvent
  
  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      HStack {
        Text(event.regionName)
          .font(.body)
          .fontWeight(.medium)
        
        Spacer()
        
        Text(event.type == .enter ? "ENTER" : "EXIT")
          .font(.caption)
          .fontWeight(.bold)
          .foregroundColor(event.type == .enter ? .green : .red)
      }
      
      Text(formatDate(event.timestamp))
        .font(.caption)
        .foregroundColor(.secondary)
    }
  }
  
  private func formatDate(_ date: Date) -> String {
    let formatter = DateFormatter()
    formatter.dateStyle = .short
    formatter.timeStyle = .medium
    return formatter.string(from: date)
  }
}

struct AddGeofenceView: View {
  @Environment(\.dismiss) private var dismiss
  @State private var name = ""
  @State private var latitude = ""
  @State private var longitude = ""
  @State private var radius = "100"
  
  let onAdd: (GeofenceRegion) -> Void
  
  var body: some View {
    NavigationView {
      Form {
        Section("Region Details") {
          TextField("Name", text: $name)
          TextField("Latitude", text: $latitude)
            .keyboardType(.decimalPad)
          TextField("Longitude", text: $longitude)
            .keyboardType(.decimalPad)
          TextField("Radius (meters)", text: $radius)
            .keyboardType(.numberPad)
        }
      }
      .navigationTitle("Add Geofence")
      .navigationBarTitleDisplayMode(.inline)
      .toolbar {
        ToolbarItem(placement: .navigationBarLeading) {
          Button("Cancel") {
            dismiss()
          }
        }
        
        ToolbarItem(placement: .navigationBarTrailing) {
          Button("Add") {
            if let lat = Double(latitude),
               let lon = Double(longitude),
               let rad = Double(radius),
               !name.isEmpty {
              let region = GeofenceRegion(
                name: name,
                latitude: lat,
                longitude: lon,
                radius: rad
              )
              onAdd(region)
              dismiss()
            }
          }
          .disabled(name.isEmpty || latitude.isEmpty || longitude.isEmpty || radius.isEmpty)
        }
      }
    }
  }
}

struct GeofenceRegion: Identifiable {
  let id = UUID()
  let name: String
  let latitude: Double
  let longitude: Double
  let radius: Double
}

struct GeofenceEvent {
  let regionName: String
  let type: GeofenceEventType
  let timestamp: Date
}

enum GeofenceEventType {
  case enter
  case exit
}

class GeofenceManager: NSObject, ObservableObject, CLLocationManagerDelegate {
  private let locationManager = CLLocationManager()
  
  @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
  @Published var isMonitoring = false
  @Published var geofenceRegions: [GeofenceRegion] = []
  @Published var geofenceEvents: [GeofenceEvent] = []
  
  var monitoredRegions: Int {
    return locationManager.monitoredRegions.count
  }
  
  override init() {
    super.init()
    locationManager.delegate = self
    authorizationStatus = locationManager.authorizationStatus
  }
  
  func addGeofence(_ region: GeofenceRegion) {
    geofenceRegions.append(region)
    
    let clRegion = CLCircularRegion(
      center: CLLocationCoordinate2D(latitude: region.latitude, longitude: region.longitude),
      radius: region.radius,
      identifier: region.id.uuidString
    )
    clRegion.notifyOnEntry = true
    clRegion.notifyOnExit = true
    
    locationManager.startMonitoring(for: clRegion)
    isMonitoring = true
  }
  
  func removeGeofence(_ region: GeofenceRegion) {
    geofenceRegions.removeAll { $0.id == region.id }
    
    let monitoredRegions = locationManager.monitoredRegions
    for monitoredRegion in monitoredRegions {
      if monitoredRegion.identifier == region.id.uuidString {
        locationManager.stopMonitoring(for: monitoredRegion)
        break
      }
    }
    
    if geofenceRegions.isEmpty {
      isMonitoring = false
    }
  }
  
  // MARK: - CLLocationManagerDelegate
  
  func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion) {
    guard let geofenceRegion = geofenceRegions.first(where: { $0.id.uuidString == region.identifier }) else { return }
    
    DispatchQueue.main.async {
      let event = GeofenceEvent(
        regionName: geofenceRegion.name,
        type: .enter,
        timestamp: Date()
      )
      self.geofenceEvents.insert(event, at: 0)
    }
  }
  
  func locationManager(_ manager: CLLocationManager, didExitRegion region: CLRegion) {
    guard let geofenceRegion = geofenceRegions.first(where: { $0.id.uuidString == region.identifier }) else { return }
    
    DispatchQueue.main.async {
      let event = GeofenceEvent(
        regionName: geofenceRegion.name,
        type: .exit,
        timestamp: Date()
      )
      self.geofenceEvents.insert(event, at: 0)
    }
  }
  
  func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
    DispatchQueue.main.async {
      self.authorizationStatus = status
    }
  }
}

struct GeofencingDiagnosticsView_Previews: PreviewProvider {
  static var previews: some View {
    NavigationView {
      GeofencingDiagnosticsView()
    }
  }
}
