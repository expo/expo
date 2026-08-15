// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct AvatarView: View {
  let account: Account
  let size: CGFloat

  var body: some View {
    let isOrganization = account.ownerUserActor == nil
    let firstLetter = String(account.name.prefix(1).uppercased())

    if isOrganization && !hasCustomProfileImage {
      let color = getExpoAvatarColor(for: firstLetter)
      Circle()
        .fill(color.background)
        .frame(width: size, height: size)
        .overlay(
          Image(systemName: "building.2")
            .font(.system(size: size * 0.44))
            .foregroundColor(color.foreground)
        )
    } else if let profileImageUrl = account.profileImageUrl,
      !profileImageUrl.isEmpty,
      let url = URL(string: profileImageUrl) {
      Avatar(url: url) { image in
        image
          .resizable()
          .scaledToFill()
      } placeholder: {
        Circle()
          .fill(Color.expoSystemGray5)
          .overlay(
            Image(systemName: isOrganization ? "building.2" : "person")
              .font(.system(size: size * 0.44))
              .foregroundColor(.secondary)
          )
      }
      .frame(width: size, height: size)
      .clipShape(Circle())
      .id("\(account.id)-\(profileImageUrl)")
    } else {
      let color = getExpoAvatarColor(for: firstLetter)
      Circle()
        .fill(color.background)
        .frame(width: size, height: size)
        .overlay(
          Text(firstLetter)
            .font(.system(size: size * 0.44, weight: .medium))
            .foregroundColor(color.foreground)
        )
    }
  }

  /// Whether the account has a custom uploaded profile image vs a default Gravatar fallback
  private var hasCustomProfileImage: Bool {
    guard let profileImageUrl = account.profileImageUrl, !profileImageUrl.isEmpty else {
      return false
    }
    return !profileImageUrl.contains("expo-website-default-avatars")
  }

  private func getExpoAvatarColor(for letter: String) -> (background: Color, foreground: Color) {
    return getAvatarColor(for: letter)
  }
}
