//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct DiagnosticsTabView: View {
  @EnvironmentObject var viewModel: HomeViewModel

  var body: some View {
    ScrollView {
      VStack(spacing: 16) {
        NavigationLink(destination: AudioDiagnosticsView()) {
          DiagnosticCard(
            title: "Audio",
            description: "On iOS you can play audio in the foreground and background, choose whether it plays when the device is on silent, and set how the audio interacts with audio from other apps. This diagnostic allows you to see the available options.",
            action: {}
          )
        }
        .buttonStyle(PlainButtonStyle())

        NavigationLink(destination: LocationDiagnosticsView()) {
          DiagnosticCard(
            title: "Background location",
            description: "On iOS it's possible to track your location when an app is foregrounded, backgrounded, or even closed. This diagnostic allows you to see what options are available, see the output, and test the functionality on your device. None of the location data will leave your device.",
            action: {}
          )
        }
        .buttonStyle(PlainButtonStyle())

        NavigationLink(destination: GeofencingDiagnosticsView()) {
          DiagnosticCard(
            title: "Geofencing",
            description: "You can fire actions when your device enters specific geographical regions represented by a longitude, latitude, and a radius. This diagnostic lets you experiment with Geofencing using regions that you specify and shows you the data that is made available. None of the data will leave your device.",
            action: {}
          )
        }
        .buttonStyle(PlainButtonStyle())
      }
      .padding()
    }
    .background(Color.expoSystemBackground)
    .navigationTitle("Diagnostics")
    .navigationBarTitleDisplayMode(.inline)
  }
}

struct DiagnosticCard: View {
  let title: String
  let description: String
  let action: () -> Void

  var body: some View {
    HStack(alignment: .top) {
      VStack(alignment: .leading, spacing: 8) {
        HStack {
          Text(title)
            .font(.headline)
            .foregroundColor(.primary)
            .multilineTextAlignment(.leading)

          Spacer()

          Image(systemName: "chevron.right")
            .font(.caption)
            .foregroundColor(.secondary)
        }

        Text(description)
          .font(.subheadline)
          .foregroundColor(.secondary)
          .multilineTextAlignment(.leading)
      }
    }
    .padding()
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(Color.expoSecondarySystemBackground)
    .clipShape(RoundedRectangle(cornerRadius: 12))
  }
}
