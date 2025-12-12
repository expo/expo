//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct NavigationHeader: View {
  @EnvironmentObject var viewModel: HomeViewModel
  @EnvironmentObject var navigation: ExpoGoNavigation

  var body: some View {
    HStack {
      HStack(spacing: 12) {
        Image("Icon")
          .resizable()
          .aspectRatio(contentMode: .fit)
          .frame(width: 32, height: 32)
          .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
          .shadow(color: Color.black.opacity(0.15), radius: 2, x: 0, y: 1)

        Text(viewModel.buildInfo["appName"] as? String ?? "Expo Go")
          .font(.headline)
          .fontWeight(.semibold)
      }

      Spacer()

      Button {
        navigation.showUserProfile()
      } label: {
        if viewModel.isLoggedIn, let user = viewModel.user {
          createUserAvatar(user: user)
        } else {
          ZStack {
            Circle()
              .fill(Color.expoSystemGray6)
              .frame(width: 36, height: 36)

            Image(systemName: "person.crop.circle")
              .font(.system(size: 18, weight: .regular))
              .foregroundColor(.secondary)
          }
        }
      }
      .buttonStyle(PlainButtonStyle())
      .accessibilityLabel("Account")
    }
    .padding(.horizontal)
    .padding(.vertical, 8)
    .background(Color.expoSystemBackground)
  }

  @ViewBuilder
  private func createUserAvatar(user: UserActor) -> some View {
    let profilePhoto = user.profilePhoto

    if let profilePhoto,
      !profilePhoto.isEmpty,
      let url = URL(string: profilePhoto) {
      Avatar(url: url) { image in
        image
          .resizable()
          .scaledToFill()
      } placeholder: {
        Circle()
          .fill(Color.expoSystemGray5)
          .overlay(
            Image(systemName: "person")
              .font(.system(size: 16))
              .foregroundColor(.secondary)
          )
      }
      .frame(width: 36, height: 36)
      .clipShape(Circle())
      .id("\(user.id)-\(profilePhoto)")
    } else {
      let firstLetter = String(user.username.prefix(1).uppercased())
      let color = getExpoAvatarColor(for: firstLetter)

      Circle()
        .fill(color.background)
        .frame(width: 36, height: 36)
        .overlay(
          Text(firstLetter)
            .font(.system(size: 16, weight: .medium))
            .foregroundColor(color.foreground)
        )
    }
  }
}
