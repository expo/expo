//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct NavigationHeader: View {
  @EnvironmentObject var viewModel: HomeViewModel
  @EnvironmentObject var navigation: ExpoGoNavigation
  @State private var showingURLInput = false
  @State private var urlText = ""

  /// Show "Enter URL" button only in simulator
  private var isSimulator: Bool {
    #if targetEnvironment(simulator)
    return true
    #else
    return false
    #endif
  }

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

      HStack(spacing: 12) {
        if isSimulator {
          Button {
            showingURLInput = true
          } label: {
            ZStack {
              Circle()
                .fill(Color.expoSystemGray6)
                .frame(width: 36, height: 36)

              Image(systemName: "plus")
                .font(.system(size: 18, weight: .medium))
                .foregroundColor(.secondary)
            }
          }
          .buttonStyle(PlainButtonStyle())
          .accessibilityLabel("Enter URL")
        }

        Button {
          navigation.showUserProfile()
        } label: {
          if viewModel.isLoggedIn, let account = viewModel.selectedAccount {
            AvatarView(account: account, size: 36)
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
    }
    .padding(.horizontal)
    .padding(.vertical, 8)
    .background(Color.expoSystemBackground)
    .sheet(isPresented: $showingURLInput) {
      EnterURLSheet(
        urlText: $urlText,
        isLoading: false,
        onConnect: { url in
          viewModel.openApp(url: url)
        },
        onDismiss: {
          showingURLInput = false
          urlText = ""
        }
      )
    }
  }
}
