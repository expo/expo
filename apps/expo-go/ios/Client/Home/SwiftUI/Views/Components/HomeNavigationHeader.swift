import SwiftUI

class HomeNavigation: ObservableObject {
  @Published var showingUserProfile: Bool = false
  
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

struct HomeNavigationHeader: View {
  @EnvironmentObject var viewModel: HomeViewModel
  @EnvironmentObject var navigation: HomeNavigation
  
  var body: some View {
    HStack {
      HStack(spacing: 12) {
        VStack {
          Image("expo-icon")
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(width: 22, height: 22)
        }
        .frame(width: 32, height: 32)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(
          RoundedRectangle(cornerRadius: 8)
            .stroke(Color.black.opacity(0.5), lineWidth: 0.2)
        )
        
        Text("Expo Go")
          .font(.headline)
          .fontWeight(.semibold)
      }
      
      Spacer()
      
      Button {
        navigation.showUserProfile()
      } label: {
        if viewModel.isAuthenticated, let user = viewModel.currentUser {
          createAccountAvatar(user: user)
        } else {
          Text("Log-In")
            .fontWeight(.semibold)
            .font(.caption2)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .overlay {
              RoundedRectangle(cornerRadius: 8, style: .continuous)
                .stroke(Color.black.opacity(0.5), lineWidth: 0.2)
            }
        }
      }.buttonStyle(PlainButtonStyle())
    }
    .padding(.horizontal)
    .padding(.vertical, 8)
    .background(Color(.systemBackground))
  }
  
  private func loadExpoGoIcon() -> UIImage? {
    return UIImage(named: "AppIcon")
  }
  
  @ViewBuilder
  private func createAccountAvatar(user: User) -> some View {
    if let profilePhoto = user.profilePhoto,
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
      .id("\(user.id)-\(profilePhoto)")
    } else {
      let firstLetter = user.username.prefix(1).uppercased()
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


struct HomeNavigationHeader_Previews: PreviewProvider {
  static var previews: some View {
    HomeNavigationHeader()
      .environmentObject(HomeViewModel())
      .environmentObject(HomeNavigation())
  }
}
