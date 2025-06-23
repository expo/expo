import SwiftUI

class DevLauncherNavigation: ObservableObject {
  @Binding var showingUserProfile: Bool

  init(showingUserProfile: Binding<Bool>) {
    self._showingUserProfile = showingUserProfile
  }

  func showUserProfile() {
    showingUserProfile = true
  }
}

func loadAppIcon(from path: String) -> UIImage? {
  if let url = URL(string: path), url.isFileURL {
    if let image = UIImage(contentsOfFile: url.path) {
      return image
    }
  }

  return nil
}

struct DevLauncherNavigationHeader: View {
  @EnvironmentObject var viewModel: DevLauncherViewModel
  @EnvironmentObject var navigation: DevLauncherNavigation

  var body: some View {
    HStack {
      HStack(spacing: 12) {
        if let path = viewModel.buildInfo["appIcon"] as? String,
          let appIcon = loadAppIcon(from: path) {
          Image(uiImage: appIcon)
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(width: 32, height: 32)
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }

        VStack(alignment: .leading, spacing: 2) {
          Text(viewModel.buildInfo["appName"] as? String ?? "")
            .font(.headline)
            .fontWeight(.semibold)

          Text("Development Build")
            .font(.caption)
            .foregroundColor(.secondary)
        }
      }

      Spacer()

      Button {
        navigation.showUserProfile()
      } label: {
        Image("user-icon", bundle: getDevLauncherBundle())
          .font(.title2)
          .foregroundColor(.black)
      }
    }
    .padding(.horizontal)
    .padding(.vertical, 8)
    .background(Color(.systemBackground))
  }
}
