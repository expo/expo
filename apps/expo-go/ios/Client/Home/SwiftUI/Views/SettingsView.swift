import SwiftUI

struct SettingsView: View {
  @State private var selectedTheme = "System"
  @State private var devMenuGestureEnabled = true
  @State private var threeFingerPressEnabled = true
  @State private var trackingEnabled = false
  
  let themeOptions = ["Light", "Dark", "System"]
  
  var body: some View {
    NavigationView {
      Form {
        Section("Appearance") {
          Picker("Theme", selection: $selectedTheme) {
            ForEach(themeOptions, id: \.self) { theme in
              Text(theme)
            }
          }
          .pickerStyle(SegmentedPickerStyle())
        }
        
        Section("Developer Menu Gestures") {
          Toggle("Shake Devive", isOn: $devMenuGestureEnabled)
          Toggle("Three-finger long press", isOn: $threeFingerPressEnabled)
        }
        
        Section("Privacy") {
          Toggle("Analytics & Tracking", isOn: $trackingEnabled)
          
          Text("Help improve Expo Go by sharing anonymous usage data")
            .font(.caption)
            .foregroundColor(.secondary)
        }
        
        Section("App Info") {
          HStack {
            Text("Client version")
            Spacer()
            Text("2.30.0")
              .foregroundColor(.secondary)
          }
          
          HStack {
            Text("Supported SDK")
            Spacer()
            Text("54")
              .foregroundColor(.secondary)
          }
        }
        
        Section {
          Button("Sign Out") {
          }
          .foregroundColor(.red)
        }
      }
      .navigationTitle("Settings")
      .navigationBarTitleDisplayMode(.inline)
    }
  }
}

struct SettingsView_Previews: PreviewProvider {
  static var previews: some View {
    SettingsView()
  }
}
