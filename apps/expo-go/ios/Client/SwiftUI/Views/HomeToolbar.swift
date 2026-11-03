// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

extension View {
  @ViewBuilder
  func homeToolbar(onEnterURL: @escaping () -> Void) -> some View {
#if compiler(>=6.4)
    if #available(iOS 27.1, *) {
      toolbar {
        VerticalBarHomeToolbar(onEnterURL: onEnterURL)
      }
    } else {
      toolbar {
        HomeToolbar(onEnterURL: onEnterURL)
      }
    }
#else
    toolbar {
      HomeToolbar(onEnterURL: onEnterURL)
    }
#endif
  }
}

private struct HomeToolbar: ToolbarContent {
  let onEnterURL: () -> Void

  var body: some ToolbarContent {
#if targetEnvironment(simulator)
    ToolbarItem(placement: .navigationBarTrailing) {
      EnterURLButton(action: onEnterURL)
    }
#endif
    ToolbarItem(placement: .navigationBarTrailing) {
      AccountButton()
    }
  }
}

#if compiler(>=6.4)
@available(iOS 27.1, *)
private struct VerticalBarHomeToolbar: ToolbarContent {
  let onEnterURL: () -> Void

  var body: some ToolbarContent {
#if targetEnvironment(simulator)
    ToolbarItem(placement: .navigationBarTrailing) {
      EnterURLButton(action: onEnterURL)
    }
    .axisBehavior(.verticalPreferred)
#endif
    ToolbarItem(placement: .navigationBarTrailing) {
      AccountButton()
    }
    .axisBehavior(.verticalPreferred)
  }
}
#endif

private struct EnterURLButton: View {
  let action: () -> Void

  var body: some View {
    Button(action: action) {
      Image(systemName: "plus")
    }
    .accessibilityLabel("Enter URL")
  }
}

private struct AccountButton: View {
  @EnvironmentObject var viewModel: HomeViewModel
  @EnvironmentObject var navigation: ExpoGoNavigation

  var body: some View {
    Button {
      navigation.showUserProfile()
    } label: {
      if viewModel.isLoggedIn, let account = viewModel.selectedAccount {
        AvatarView(account: account, size: 28)
      } else {
        Image(systemName: "person.crop.circle")
      }
    }
    .accessibilityLabel("Account")
  }
}
