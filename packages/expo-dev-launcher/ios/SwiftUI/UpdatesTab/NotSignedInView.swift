import SwiftUI

struct NotSignedInView: View {
  var body: some View {
    List {
      Section {
        VStack(spacing: 16) {
          Image(systemName: "arrow.2.circlepath")
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(width: 44, height: 44)
            .foregroundColor(.blue)

          VStack(spacing: 8) {
            Text("Sign in to view updates")
              .font(.headline)
              .multilineTextAlignment(.center)

            Text("Sign in to your Expo account to see available EAS Updates for this project.")
              .font(.system(size: 14))
              .multilineTextAlignment(.center)
              .foregroundStyle(.secondary)
          }
        }
      }
    }
  }
}

#Preview {
  NotSignedInView()
}
