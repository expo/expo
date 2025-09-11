import SwiftUI

struct NotUsingUpdatesView: View {
  var body: some View {
    List {
      Section {
        VStack(spacing: 16) {
          Image(systemName: "exclamationmark.triangle")
            .resizable()
            .scaledToFit()
            .frame(width: 44, height: 44)
            .foregroundColor(.orange)

          VStack(spacing: 8) {
            Text("EAS Update not configured")
              .font(.headline)
              .multilineTextAlignment(.center)

            Text("This project is not configured to use EAS Update. Configure EAS Update to see available updates here.")
              .font(.system(size: 14))
              .multilineTextAlignment(.center)
              .foregroundStyle(.secondary)

            if let destination = URL(string: "https://docs.expo.dev/eas-update/getting-started/") {
              Link("Learn more about EAS Update", destination: destination)
                .font(.system(size: 14))
                .foregroundColor(.blue)
            }
          }
        }
      }
    }
  }
}

#Preview {
  NotUsingUpdatesView()
}
