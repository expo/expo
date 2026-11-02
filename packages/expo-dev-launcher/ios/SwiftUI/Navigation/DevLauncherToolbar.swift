// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

extension View {
  func devLauncherToolbar() -> some View {
    toolbar {
      ToolbarItem(placement: .primaryAction) {
        AccountButton()
      }
      .verticalBarPreferred()
    }
  }
}

extension ToolbarContent {
  @ToolbarContentBuilder
  func verticalBarPreferred() -> some ToolbarContent {
#if os(iOS) && compiler(>=6.4)
    if #available(iOS 27.1, *) {
      axisBehavior(.verticalPreferred)
    } else {
      self
    }
#else
    self
#endif
  }

  @ToolbarContentBuilder
  func sharedBackgroundHidden() -> some ToolbarContent {
#if os(iOS) || os(macOS)
    if #available(iOS 26.0, macOS 26.0, *) {
      sharedBackgroundVisibility(.hidden)
    } else {
      self
    }
#else
    self
#endif
  }
}

private struct AccountButton: View {
  @EnvironmentObject var viewModel: DevLauncherViewModel
  @EnvironmentObject var navigation: DevLauncherNavigation

  var body: some View {
    Button {
      navigation.showUserProfile()
    } label: {
      if viewModel.isAuthenticated, let account = viewModel.selectedAccount {
        AccountAvatar(account: account)
      } else {
        Image(systemName: "person.crop.circle")
      }
    }
    .accessibilityLabel("Account")
  }
}

private struct AccountAvatar: View {
  let account: UserAccount

  var body: some View {
    let isOrganization = account.ownerUserActor == nil
    let profilePhoto = account.ownerUserActor?.profilePhoto
    let name = account.ownerUserActor?.fullName ?? account.name

    if isOrganization {
      let color = getAvatarColor(for: String(name.first ?? "o"))

      Circle()
        .fill(color.background)
        .frame(width: 28, height: 28)
        .overlay(
          Image(systemName: "building.2")
            .font(.system(size: 12))
            .foregroundStyle(color.foreground)
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
              .font(.system(size: 14))
              .foregroundStyle(Color.secondary)
          )
      }
      .frame(width: 28, height: 28)
      .clipShape(Circle())
      .id("\(account.id)-\(profilePhoto)")
    } else {
      let firstLetter = (account.ownerUserActor?.username ?? account.name).prefix(1).uppercased()
      let color = getAvatarColor(for: String(firstLetter))

      Circle()
        .fill(color.background)
        .frame(width: 28, height: 28)
        .overlay(
          Text(firstLetter)
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(color.foreground)
        )
    }
  }
}
