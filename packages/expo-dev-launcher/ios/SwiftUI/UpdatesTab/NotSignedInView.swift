import SwiftUI

struct NotSignedInView: View {
  @EnvironmentObject var navigation: DevLauncherNavigation

  var body: some View {
    VStack(spacing: 16) {
      Image(systemName: "square.and.arrow.down")
        .resizable()
        .aspectRatio(contentMode: .fit)
        .frame(width: 44, height: 44)
        .rotationEffect(.degrees(-90))
        .foregroundColor(.blue)

      VStack(spacing: 8) {
        Text("Sign in to view updates")
          .font(.title3)
          .fontWeight(.semibold)
          .multilineTextAlignment(.center)

        Text("Sign in to your Expo account to see available EAS Updates for this project.")
          .font(.system(size: 14))
          .multilineTextAlignment(.center)
          .foregroundStyle(.secondary)
      }

      Button {
        navigation.showUserProfile()
      } label: {
        Text("Sign in")
          .padding(.horizontal, 16)
          .padding(.vertical, 8)
          .background(Color.black)
          .cornerRadius(16)
          .foregroundColor(.white)
          .font(.system(size: 16, weight: .semibold))
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
  }
}

#Preview {
  NotSignedInView()
}
