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
        if viewModel.isAuthenticated, let selectedAccount = viewModel.selectedAccount {
          createAccountAvatar(account: selectedAccount)
        } else {
          Image("user-icon", bundle: getDevLauncherBundle())
            .font(.title2)
            .foregroundColor(.black)
        }
      }
    }
    .padding(.horizontal)
    .padding(.vertical, 8)
    .background(Color(.systemBackground))
  }

  @ViewBuilder
  private func createAccountAvatar(account: UserAccount) -> some View {
    let isOrganization = account.ownerUserActor == nil
    let profilePhoto = account.ownerUserActor?.profilePhoto
    let name = account.ownerUserActor?.fullName ?? account.name

    if isOrganization {
      let color = getAvatarColor(for: String(name.first ?? "o"))

      Circle()
        .fill(color.background)
        .frame(width: 32, height: 32)
        .overlay(
          Image(systemName: "building.2")
            .font(.system(size: 14))
            .foregroundColor(color.foreground)
        )
    } else if let profilePhoto = profilePhoto,
      !profilePhoto.isEmpty,
      let url = URL(string: profilePhoto) {
      Avatar(url: url) { image in
        image
          .resizable()
          .aspectRatio(contentMode: .fill)
      } placeholder: {
        Circle()
          .fill(Color(.systemGray5))
          .overlay(
            Image(systemName: "person")
              .font(.system(size: 16))
              .foregroundColor(.secondary)
          )
      }
      .frame(width: 32, height: 32)
      .clipShape(Circle())
      .id("\(account.id)-\(profilePhoto)")
    } else {
      let firstLetter = (account.ownerUserActor?.username ?? account.name).prefix(1).uppercased()
      let color = getAvatarColor(for: String(firstLetter))

      Circle()
        .fill(color.background)
        .frame(width: 32, height: 32)
        .overlay(
          Text(firstLetter)
            .font(.system(size: 14, weight: .medium))
            .foregroundColor(color.foreground)
        )
    }
  }
}
