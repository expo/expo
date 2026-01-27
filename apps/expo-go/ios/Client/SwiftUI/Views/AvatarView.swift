// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct AvatarView: View {
  let account: Account
  let size: CGFloat

  var body: some View {
    let isOrganization = account.ownerUserActor == nil
    let profilePhoto = account.ownerUserActor?.profilePhoto
    let name = account.ownerUserActor?.username ?? account.name
    let firstLetter = String(name.prefix(1).uppercased())

    if isOrganization {
      let color = getExpoAvatarColor(for: firstLetter)
      Circle()
        .fill(color.background)
        .frame(width: size, height: size)
        .overlay(
          Image(systemName: "building.2")
            .font(.system(size: size * 0.44))
            .foregroundColor(color.foreground)
        )
    } else if let profilePhoto,
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
              .font(.system(size: size * 0.44))
              .foregroundColor(.secondary)
          )
      }
      .frame(width: size, height: size)
      .clipShape(Circle())
      .id("\(account.id)-\(profilePhoto)")
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

  private func getExpoAvatarColor(for letter: String) -> (background: Color, foreground: Color) {
    return getAvatarColor(for: letter)
  }
}
