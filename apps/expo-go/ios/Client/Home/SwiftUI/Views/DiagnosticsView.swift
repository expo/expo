import SwiftUI

struct DiagnosticsView: View {
  var body: some View {
    NavigationView {
      ScrollView {
        VStack(spacing: 24) {
          AudioDiagnosticCard()
          LocationDiagnosticCard()
          GeofencingDiagnosticCard()
        }
        .padding()
      }
      .navigationTitle("Diagnostics")
      .navigationBarTitleDisplayMode(.inline)
    }
  }
}

struct AudioDiagnosticCard: View {
  var body: some View {
    DiagnosticCard(
      title: "Audio",
      description: "On iOS you can play audio in the foreground and background, choose whether it plays when the device is on silent, and set how the audio interacts with audio from other apps. This diagnostic allows you to see the available options.",
      destination: AnyView(AudioDiagnosticsView())
    )
  }
}

struct LocationDiagnosticCard: View {
  var body: some View {
    DiagnosticCard(
      title: "Background location",
      description: "On iOS it's possible to track your location when an app is foregrounded, backgrounded, or even closed. This diagnostic allows you to see what options are available, see the output, and test the functionality on your device. None of the location data will leave your device.",
      destination: AnyView(LocationDiagnosticsView())
    )
  }
}

struct GeofencingDiagnosticCard: View {
  var body: some View {
    DiagnosticCard(
      title: "Geofencing",
      description: "You can fire actions when your device enters specific geographical regions represented by a longitude, latitude, and a radius. This diagnostic lets you experiment with Geofencing using regions that you specify and shows you the data that is made available. None of the data will leave your device.",
      destination: AnyView(GeofencingDiagnosticsView())
    )
  }
}

struct DiagnosticCard: View {
  let title: String
  let description: String
  let destination: AnyView
  
  var body: some View {
    NavigationLink(destination: destination) {
      VStack(alignment: .leading, spacing: 8) {
        HStack {
          Text(title)
            .font(.system(size: 14, weight: .semibold))
            .foregroundColor(.primary)
          
          Spacer()
          
          Image(systemName: "chevron.right")
            .font(.system(size: 12))
            .foregroundColor(.secondary)
        }
        
        Text(description)
          .font(.system(size: 14))
          .foregroundColor(.secondary)
          .multilineTextAlignment(.leading)
          .lineLimit(nil)
      }
      .padding()
      .background(Color(.systemBackground))
      .cornerRadius(12)
      .overlay(
        RoundedRectangle(cornerRadius: 12)
          .stroke(Color(.separator), lineWidth: 0.5)
      )
    }
    .buttonStyle(PlainButtonStyle())
  }
}

struct DiagnosticsView_Previews: PreviewProvider {
  static var previews: some View {
    DiagnosticsView()
  }
}
